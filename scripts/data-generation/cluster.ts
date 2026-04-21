import {
  MODEL_LARGE_REASONING,
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  REDUCE_CHUNK_SIZE,
  DATA_DIR,
  OUTPUT_DIR,
  OUTPUT_RAW_DIR,
  DEBUG_OUTPUT_DIR,
  DEMOGRAPHIC_NAME,
  DATA_VERSION,
} from "./config.js";
import {
  Topic,
  RawSurveyData,
  SurveyResult,
  AnswerCluster,
  WildCard,
  AnswerCategory,
} from "./types.js";
import { loadJson, ensureDir, writeJson, getNextVersionPath, getNextDebugRunDir, fileExists, buildOutputFilename } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { normalizeScoresTo100 } from "./lib/normalization.js";
import { aggregateAssignments, type AggregateAssignmentsResult } from "./lib/aggregation.js";
import { renderProgressBar } from "./utils/progress.js";
import { parseCliArgs } from "./utils/cli.js";
import {
  buildExtractCategoriesPrompt,
  buildAssignChunkPrompt,
  extractCategoriesSchema,
  assignClustersChunkSchema,
} from "./lib/prompts/cluster-prompts.js";

import { runWithConcurrency } from './utils/concurrency.js';


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
  const answers = rawData.rawResponses.map(r => r.text);

  const prompt = buildExtractCategoriesPrompt({
    topicText,
    answers,
    answerCount: answers.length,
  });

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

  // Build all chunk task thunks upfront
  const chunks: typeof responses[number][][] = [];
  for (let j = 0; j < responses.length; j += REDUCE_CHUNK_SIZE) {
    chunks.push(responses.slice(j, j + REDUCE_CHUNK_SIZE));
  }

  const chunkTasks = chunks.map((chunk) => async (): Promise<AssignClustersChunkResult> => {
    const prompt = buildAssignChunkPrompt({
      topicText,
      categoriesList,
      chunkCount: chunk.length,
      answersList: JSON.stringify(
        chunk.map((r) => ({ id: r.personaId, text: r.text })),
        null,
        2,
      ),
    });
    return callLMStudioWithRetry<AssignClustersChunkResult>(
      prompt,
      MODEL_SMALL_PARALLEL,
      0,
      2000,
      1,
      debugLabel,
      assignClustersChunkSchema,
      debugSubDir,
    )
      .then((res) => res.data)
      .catch((): AssignClustersChunkResult => ({
        assignments: chunk.map((r) => ({
          personaId: r.personaId,
          assignedCategory: 'wildcard',
        })),
      }));
  });

  const chunkResults = await runWithConcurrency(chunkTasks, CONCURRENCY_LIMIT, (done, total) => {
    // Scale progress back to response count for a meaningful bar
    process.stdout.write(
      `\r   Assigning Clusters: ${renderProgressBar(done * REDUCE_CHUNK_SIZE, responses.length)}`
    );
  });

  console.log(); // newline after progress bar

  for (const res of chunkResults) {
    assignmentsResult.push(...res.assignments);
  }

  // Aggregate chunk results into per-category persona buckets (pure function)
  const finalResult = aggregateAssignments(assignmentsResult, categories);

  return finalResult;
}

async function processTopic(
  topicId: string,
  topicText: string,
  demographicName: string,
  version: string,
  providedCategories?: AnswerCategory[]
): Promise<SurveyResult> {
  const debugSubDir = getNextDebugRunDir(topicId, DEBUG_OUTPUT_DIR);
  const rawFilename = buildOutputFilename(topicId, demographicName, version);
  const rawPath = `${OUTPUT_RAW_DIR}/${rawFilename}`;

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
  // Build a fast lookup map from personaId -> rawAnswer
  const rawAnswerByPersonaId = new Map<string, string>(
    rawData.rawResponses.map(r => [r.personaId, r.text])
  );
  for (let i = 0; i < clusterResult.wildcardPersonaIds.length; i++) {
    const personaId = clusterResult.wildcardPersonaIds[i];
    wildcards.push({
      personaId,
      rawAnswer: rawAnswerByPersonaId.get(personaId) ?? '',
      synonyms: [],
      flavorQuote: { personaName: 'Unknown', text: 'To be enriched' }, // To be populated by enrichment.ts
    });
  }

  return {
    id: topicId,
    topicText: topicText,
    demographicName: rawData.demographicName,
    clusters,
    wildcards,
  };
}

async function main() {
  const { limit, topicId: specificTopicId, runMissing, rawCategories, demographic } = parseCliArgs(process.argv.slice(2));

  const parsedCategories = rawCategories ? JSON.parse(rawCategories) : undefined;
  const demographicName = demographic ?? DEMOGRAPHIC_NAME;
  const version = DATA_VERSION;

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
      const rawFilename = buildOutputFilename(topic.id, demographicName, version);
      const outputFilename = buildOutputFilename(topic.id, demographicName, version);
      const rawExists = fileExists(`${OUTPUT_RAW_DIR}/${rawFilename}`);
      const outputExists = fileExists(`${OUTPUT_DIR}/${outputFilename}`);
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

      const result = await processTopic(topic.id, topic.uiText, demographicName, version, categories);
      const outputFilename = buildOutputFilename(topic.id, demographicName, version);
      const outputPath = `${OUTPUT_DIR}/${outputFilename}`;
      writeJson(outputPath, result);
      console.log(`Saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${topic.id}:`, error);
    }
  }

  console.log("\n=== Clustering complete ===");
}

main().catch(console.error);
