import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
  SurveyResultDocument,
  AnswerCluster,
  WildCard,
} from "./types.js";
import { loadJson, ensureDir, writeJson } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { normalizeScoresTo100 } from "./lib/normalization.js";
import { renderProgressBar } from "./utils/progress.js";

function getNextVersionPath(basePath: string): string {
  if (!fs.existsSync(basePath)) return basePath;
  const ext = path.extname(basePath);
  const base = basePath.slice(0, -ext.length);
  let v = 2;
  while (fs.existsSync(`${base}-v${v}${ext}`)) {
    v++;
  }
  return `${base}-v${v}${ext}`;
}

function getNextDebugRunDir(topicId: string): string {
  // DEBUG_DIR is scripts/output/debug
  const debugBase = path.join(process.cwd(), "scripts/output/debug");
  ensureDir(debugBase);
  let run = 1;
  while (fs.existsSync(path.join(debugBase, `${topicId}-run-${run}`))) {
    run++;
  }
  const runDir = `${topicId}-run-${run}`;
  ensureDir(path.join(debugBase, runDir));
  return runDir;
}

const extractConceptsSchema = {
  name: "extract_concepts",
  schema: {
    type: "object",
    properties: {
      concepts: {
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
    required: ["concepts"]
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

export interface ExtractedConcept {
  id: string;
  uiText: string;
  aiPromptName: string;
}

interface ExtractConceptsResult {
  concepts: ExtractedConcept[];
}

interface AssignClustersChunkResult {
  assignments: Array<{
    personaId: string;
    assignedCategory: string;
  }>;
}

interface AssignClustersResult {
  clusters: Array<{
    concept: ExtractedConcept;
    personaIds: string[];
  }>;
  wildcardPersonaIds: string[];
}

async function extractConcepts(rawData: RawSurveyData, topicText: string, debugSubDir?: string): Promise<ExtractedConcept[]> {
  const answersList = rawData.rawResponses.map(r => r.text).join('\n');

  const prompt = `You are a semantic analyst for a "Family Feud" style game show. 
TOPIC: "${topicText}"

RAW ANSWERS:
${answersList}

TASK: Analyze the ${rawData.rawResponses.length} answers and extract 5 to 8 core concepts that represent the most frequent semantic themes.
GOAL: Maximize coverage so that most raw answers fit into one of these concepts. Ensure concepts do not overlap.

For each concept, provide:
1. "id": A strict, lowercase-kebab-case identifier (e.g., "locked-doors").
2. "uiText": A punchy, flavorful name for the game board (e.g., "Checking the Locks!").
3. "aiPromptName": A broad description of the semantic bucket to help another AI map synonymous answers (e.g., "Verifying that doors, windows, or gates are locked and secure").

Output ONLY valid JSON according to the schema.`;

  const debugLabel = 'cluster_map_' + (debugSubDir || 'unknown');
  const { data: result } = await callLMStudioWithRetry<ExtractConceptsResult>(
    prompt,
    MODEL_LARGE_REASONING,
    0.7,
    16000,
    1,
    debugLabel,
    extractConceptsSchema,
    debugSubDir
  );

  return result.concepts;
}

async function assignClusters(rawData: RawSurveyData, concepts: ExtractedConcept[], topicText: string, debugSubDir?: string): Promise<AssignClustersResult> {
  const reducedConcepts = [
    ...concepts.map(c => ({
      id: c.id,
      description: c.aiPromptName
    })),
    {
      id: "wildcard",
      description: "Use this ONLY if the answer is completely nonsensical, unrelated, or a literal outlier that fits zero other categories."
    }
  ];
  const conceptsList = JSON.stringify(reducedConcepts, null, 2);
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
${conceptsList}

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
          undefined,
          debugLabel,
          assignClustersChunkSchema,
          debugSubDir
        ).then(res => res.data).catch(err => {
          // Fallback logic for unparseable chunk
          return {
            assignments: chunk.map(r => ({
              personaId: r.personaId,
              assignedCategory: "wildcard",
              isWildcard: true
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

  // Aggregate chunk results into the final AssignClustersResult
  const finalResult: AssignClustersResult = {
    clusters: concepts.map(c => ({ concept: c, personaIds: [] })),
    wildcardPersonaIds: []
  };

  const validConceptIds = new Set(concepts.map(c => c.id));

  for (const assignment of assignmentsResult) {
    if (assignment.assignedCategory === "wildcard" || !validConceptIds.has(assignment.assignedCategory)) {
      finalResult.wildcardPersonaIds.push(assignment.personaId);
    } else {
      const cluster = finalResult.clusters.find(c => c.concept.id === assignment.assignedCategory);
      if (cluster) {
        cluster.personaIds.push(assignment.personaId);
      } else {
        // Fallback for hallucinated category
        finalResult.wildcardPersonaIds.push(assignment.personaId);
      }
    }
  }

  return finalResult;
}

async function processTopic(
  topicId: string,
  topicText: string,
  providedConcepts?: ExtractedConcept[]
): Promise<SurveyResultDocument> {
  const debugSubDir = getNextDebugRunDir(topicId);
  const rawPath = `${OUTPUT_RAW_DIR}/${topicId}.json`;

  const rawData = await loadJson<RawSurveyData>(rawPath);
  console.log(`Processing ${topicId} with ${rawData.rawResponses.length} responses`);

  let concepts: ExtractedConcept[];
  if (providedConcepts) {
    concepts = providedConcepts;
    console.log(`Using provided concepts:`, concepts);
  } else {
    console.log(`1. Stage 1 (Map): Extracting Core Concepts...`);
    concepts = await extractConcepts(rawData, topicText, debugSubDir);
    console.log(`   -> Extracted ${concepts.length} concepts:`, concepts);
  }

  console.log(`2. Stage 2 (Reduce): Assigning IDs to Concepts... (This takes ~15-30s)`);
  const clusterResult = await assignClusters(rawData, concepts, topicText, debugSubDir);
  console.log(`   -> Mapped into ${clusterResult.clusters.length} clusters and ${clusterResult.wildcardPersonaIds.length} wildcards`);

  console.log(`3. Stage 3 (Math): Normalizing scores to 100...`);
  const rawCounts = clusterResult.clusters.map((c) => c.personaIds.length);
  const normalizedScores = normalizeScoresTo100(rawCounts);

  const clusters: AnswerCluster[] = [];
  for (let i = 0; i < clusterResult.clusters.length; i++) {
    const cluster = clusterResult.clusters[i];
    clusters.push({
      text: cluster.concept.uiText,
      score: normalizedScores[i],
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
  const args = process.argv.slice(2);
  const limit = args.includes("--limit")
    ? parseInt(args[args.indexOf("--limit") + 1], 10)
    : undefined;

  const topicArg = args.indexOf("--topic");
  const specificTopicId = topicArg !== -1 ? args[topicArg + 1] : undefined;

  const conceptsArg = args.indexOf("--concepts");
  const providedConcepts = conceptsArg !== -1 
    ? JSON.parse(args[conceptsArg + 1])
    : undefined;

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);
  ensureDir(OUTPUT_DIR);

  let topicsToProcess = topics;
  if (specificTopicId) {
    topicsToProcess = topics.filter(t => t.id === specificTopicId);
    if (topicsToProcess.length === 0) {
      console.error(`Error: Topic ID "${specificTopicId}" not found in topics-v1.json`);
      process.exit(1);
    }
  } else if (limit) {
    topicsToProcess = topics.slice(0, limit);
  }

  console.log(`Processing ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Processing topic: ${topic.id} ===`);

    try {
      const concepts = Array.isArray(providedConcepts) 
        ? providedConcepts 
        : (providedConcepts?.concepts || undefined);

      const result = await processTopic(topic.id, topic["text-ui"], concepts);
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
