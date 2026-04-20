import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MODEL_LARGE_REASONING,
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  REDUCE_CHUNK_SIZE,
  DATA_DIR,
  OUTPUT_DIR,
  OUTPUT_RAW_DIR,
} from "./config.js";
import {
  Topic,
  RawSurveyData,
  SurveyResult,
  AnswerCluster,
  WildCard,
  AnswerCategory,
} from "./types.js";
import { loadJson, ensureDir, writeJson, getNextVersionPath, getNextDebugRunDir } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { normalizeScoresTo100 } from "./lib/normalization.js";
import { aggregateAssignments, type AggregateAssignmentsResult } from "./lib/aggregation.js";
import { renderProgressBar } from "./utils/progress.js";
import { parseCliArgs } from "./utils/cli.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_BASE = path.join(__dirname, "../../output/debug");



const extractCategoriesSchema = {
  name: "extract_categories",
  schema: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            uiText: { type: "string" },
            aiPromptName: { type: "string" }
          },
          required: ["id", "uiText", "aiPromptName"]
        },
        minItems: 5,
        maxItems: 8
      }
    },
    required: ["categories"]
  }
};

const assignClustersChunkSchema = {
  name: "assign_clusters_chunk",
  schema: {
    type: "object",
    properties: {
      assignments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            assignedCategory: { type: "string" }
          },
          required: ["personaId", "assignedCategory"]
        }
      }
    },
    required: ["assignments"]
  }
};



interface ExtractCategoriesResult {
  categories: AnswerCategory[];
}

interface AssignClustersChunkResult {
  assignments: Array<{
    personaId: string;
    assignedCategory: string;
  }>;
}



async function extractCategories(rawData: RawSurveyData, topicText: string, debugSubDir?: string): Promise<AnswerCategory[]> {
  const answersList = rawData.rawResponses.map(r => r.text).join('\n');

  const prompt = `You are a semantic analyst for a "Family Feud" style game show. 
TOPIC: "${topicText}"

RAW ANSWERS:
${answersList}

TASK: Analyze the ${rawData.rawResponses.length} answers and extract 5 to 8 core categories that represent the most frequent semantic themes.
GOAL: Maximize coverage so that most raw answers fit into one of these categories. Ensure categories do not overlap.

For each category, provide:
1. "id": A strict, lowercase-kebab-case identifier (e.g., "locked-doors").
2. "uiText": A punchy, flavorful name for the game board (e.g., "Checking the Locks!").
3. "aiPromptName": A broad description of the semantic bucket to help another AI map synonymous answers (e.g., "Verifying that doors, windows, or gates are locked and secure").

Output ONLY valid JSON according to the schema.`;

  const debugLabel = 'cluster_map_' + (debugSubDir || 'unknown');
  const { data: result } = await callLMStudioWithRetry<ExtractCategoriesResult>(
    prompt,
    MODEL_LARGE_REASONING,
    0.7,
    16000,
    1,
    debugLabel,
    extractCategoriesSchema,
    debugSubDir
  );

  return result.categories;
}

async function assignClusters(rawData: RawSurveyData, categories: AnswerCategory[], topicText: string, debugSubDir?: string): Promise<AggregateAssignmentsResult> {
  const reducedCategories = [
    ...categories.map(c => ({
      id: c.id,
      description: c.aiPromptName
    })),
    {
      id: "wildcard",
      description: "Use this ONLY if the answer is completely nonsensical, unrelated, or a literal outlier that fits zero other categories."
    }
  ];
  const categoriesList = JSON.stringify(reducedCategories, null, 2);
  const responses = rawData.rawResponses;
  const assignmentsResult: AssignClustersChunkResult["assignments"] = [];

  const debugLabel = 'cluster_reduce_' + (debugSubDir || 'unknown');

  for (let i = 0; i < responses.length; i += CONCURRENCY_LIMIT * REDUCE_CHUNK_SIZE) {
    const batch = responses.slice(i, i + CONCURRENCY_LIMIT * REDUCE_CHUNK_SIZE);
    process.stdout.write(`\r   Assigning Clusters: ${renderProgressBar(Math.min(i + CONCURRENCY_LIMIT * REDUCE_CHUNK_SIZE, responses.length), responses.length)}`);

    const chunkPromises = [];
    for (let j = 0; j < batch.length; j += REDUCE_CHUNK_SIZE) {
      const chunk = batch.slice(j, j + REDUCE_CHUNK_SIZE);
      const answersList = JSON.stringify(
        chunk.map((r) => ({ id: r.personaId, text: r.text })),
        null,
        2
      );

      const prompt = `You are a deterministic data mapping engine.
TOPIC: "${topicText}"

TASK: Map each of the ${chunk.length} personaIds to the MOST SPECIFIC category "id" from the list below.

CATEGORIES:
${categoriesList}

STRICT RULES:
1. You MUST choose an exact "id" from the Categories array for assignedCategory.
2. Every personaId from the input must appear in the output exactly once.
3. DO NOT modify, shorten, or make up new ids.
4. Process the "Raw Answers" list sequentially.
5. No reasoning, no chatter. Output ONLY valid JSON according to the schema.

ANSWERS TO MAP:
${answersList}`;

      chunkPromises.push(
        callLMStudioWithRetry<AssignClustersChunkResult>(
          prompt,
          MODEL_SMALL_PARALLEL,
          0,
          2000,
          1,           // explicit: 1 attempt is intentional for Reduce speed
          debugLabel,
          assignClustersChunkSchema,
          debugSubDir
        ).then(res => res.data).catch(() => {
          // Fallback: assign all responses in this chunk to wildcard
          return {
            assignments: chunk.map(r => ({
              personaId: r.personaId,
              assignedCategory: "wildcard",
            }))
          };
        })
      );
    }

    const chunkResults = await Promise.all(chunkPromises);
    for (const res of chunkResults) {
      assignmentsResult.push(...res.assignments);
    }
  }

  console.log(); // New line after progress bar

  // Aggregate chunk results into per-category persona buckets (pure function)
  const finalResult = aggregateAssignments(assignmentsResult, categories);

  return finalResult;
}

async function processTopic(
  topicId: string,
  topicText: string,
  providedCategories?: AnswerCategory[]
): Promise<SurveyResult> {
  const debugSubDir = getNextDebugRunDir(topicId, DEBUG_BASE);
  const rawPath = `${OUTPUT_RAW_DIR}/${topicId}.json`;

  const rawData = await loadJson<RawSurveyData>(rawPath);
  console.log(`Processing ${topicId} with ${rawData.rawResponses.length} responses`);

  let categories: AnswerCategory[];
  if (providedCategories) {
    categories = providedCategories;
    console.log(`Using provided categories:`, categories);
  } else {
    console.log(`1. Stage 1 (Map): Extracting Core Categories...`);
    categories = await extractCategories(rawData, topicText, debugSubDir);
    console.log(`   -> Extracted ${categories.length} categories:`, categories);
  }

  console.log(`2. Stage 2 (Reduce): Assigning IDs to Categories... (This takes ~15-30s)`);
  const clusterResult = await assignClusters(rawData, categories, topicText, debugSubDir);
  console.log(`   -> Mapped into ${clusterResult.clusters.length} clusters and ${clusterResult.wildcardPersonaIds.length} wildcards`);

  console.log(`3. Stage 3 (Math): Normalizing scores to 100...`);
  const rawCounts = clusterResult.clusters.map((c) => c.personaIds.length);
  const normalizedScores = normalizeScoresTo100(rawCounts);

  const clusters: AnswerCluster[] = [];
  for (let i = 0; i < clusterResult.clusters.length; i++) {
    const cluster = clusterResult.clusters[i];
    clusters.push({
      text: cluster.category.uiText,
      score: normalizedScores[i],
      personaIds: cluster.personaIds,  // preserved for enrichment.ts
      synonyms: [],
      flavorQuotes: [], // To be populated by enrichment.ts
    });
  }

  clusters.sort((a, b) => b.score - a.score);

  const wildcards: WildCard[] = [];
  for (let i = 0; i < clusterResult.wildcardPersonaIds.length; i++) {
    const personaId = clusterResult.wildcardPersonaIds[i];
    wildcards.push({
      personaId,
      synonyms: [],
      flavorQuote: { personaName: 'Unknown', text: 'To be enriched' }, // To be populated by enrichment.ts
    });
  }

  return {
    id: crypto.randomUUID(),
    topicText: topicText,
    demographicName: rawData.demographicName,
    clusters,
    wildcards,
  };
}

async function main() {
  const { limit, topicId: specificTopicId, runMissing, rawCategories } = parseCliArgs(process.argv.slice(2));

  const parsedCategories = rawCategories ? JSON.parse(rawCategories) : undefined;

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);
  ensureDir(OUTPUT_DIR);

  let topicsToProcess = topics;
  if (specificTopicId) {
    topicsToProcess = topics.filter(t => t.id === specificTopicId);
    if (topicsToProcess.length === 0) {
      console.error(`Error: Topic ID "${specificTopicId}" not found in topics-v1.json`);
      process.exit(1);
    }
  } else if (runMissing) {
    topicsToProcess = topics.filter(topic => {
      const rawExists = fs.existsSync(`${OUTPUT_RAW_DIR}/${topic.id}.json`);
      const outputExists = fs.existsSync(`${OUTPUT_DIR}/${topic.id}.json`);
      return rawExists && !outputExists;
    });
    console.log(`Found ${topicsToProcess.length} topics with raw data but no clusterized output.`);
  }

  if (limit) {
    topicsToProcess = topicsToProcess.slice(0, limit);
  }

  console.log(`Processing ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Processing topic: ${topic.id} ===`);

    try {
      const categories = Array.isArray(parsedCategories)
        ? parsedCategories
        : (parsedCategories?.categories || undefined);

      const result = await processTopic(topic.id, topic.uiText, categories);
      const outputPath = getNextVersionPath(`${OUTPUT_DIR}/${topic.id}.json`);
      writeJson(outputPath, result);
      console.log(`Saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${topic.id}:`, error);
    }
  }

  console.log("\n=== Clustering complete ===");
}

main().catch(console.error);
