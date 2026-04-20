/**
* enrichment.ts — Enrichment Pipeline Orchestrator
*
* Takes a clustered SurveyResult (output from cluster.ts) and enriches it in
* three parallel sub-steps:
*   A) Cluster Synonym Generation
*   B) Cluster Quote Generation
*   C) Wildcard Quote Generation
*   D) Assembly — sets enrichedAt, saves versioned file
*
* Usage:
*   npx tsx scripts/data-generation/enrichment.ts
*   npx tsx scripts/data-generation/enrichment.ts --topic <topicId>
*   npx tsx scripts/data-generation/enrichment.ts --missing
*   npx tsx scripts/data-generation/enrichment.ts --limit 5
*/
import fs from 'node:fs';
import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  OUTPUT_DIR,
  OUTPUT_RAW_DIR,
  DATA_DIR,
} from './config.js';
import type {
  SurveyResult,
  AnswerCluster,
  WildCard,
  RawSurveyData,
  Topic,
} from './types.js';
import { loadJson, writeJson, getNextVersionPath } from './utils/fs.js';
import { callLMStudioWithRetry } from './utils/llm.js';
import { parseCliArgs } from './utils/cli.js';
import {
  selectPersonasForCluster,
  selectPersonaForWildcard,
  validateSynonyms,
  validateClusterQuotes,
  validateWildcardQuote,
  assembleFinalResult,
} from './lib/enrichment.js';
import {
  buildSynonymPrompt,
  synonymJobSchema,
} from './lib/prompts/synonyms-prompts.js';
import {
  buildClusterQuotePrompt,
  buildWildcardQuotePrompt,
  clusterQuoteJobSchema,
  wildcardQuoteJobSchema,
} from './lib/prompts/quotes-prompts.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES_PER_CLUSTER = 2;

// ─── Sub-step A: Cluster Synonym Generation ───────────────────────────────────

async function enrichClusterSynonyms(
  cluster: AnswerCluster,
  topicText: string
): Promise<string[]> {
  const prompt = buildSynonymPrompt({ clusterText: cluster.text, topicText });
  const { data: raw } = await callLMStudioWithRetry<unknown>(
    prompt,
    MODEL_SMALL_PARALLEL,
    0.7,
    500,
    3,
    'enrichment_synonyms',
    synonymJobSchema
  );
  return validateSynonyms(raw);
}

// ─── Sub-step B: Cluster Quote Generation ────────────────────────────────────

async function enrichClusterQuotes(
  cluster: AnswerCluster,
  rawData: RawSurveyData,
  topicText: string
) {
  const selectedPersonas = selectPersonasForCluster(cluster, rawData, QUOTES_PER_CLUSTER);

  if (selectedPersonas.length === 0) {
    return [];
  }

  const prompt = buildClusterQuotePrompt({
    clusterText: cluster.text,
    topicText,
    selectedPersonas,
  });

  const { data: raw } = await callLMStudioWithRetry<unknown>(
    prompt,
    MODEL_SMALL_PARALLEL,
    0.7,
    500,
    3,
    'enrichment_cluster_quote',
    clusterQuoteJobSchema
  );

  const expectedIds = selectedPersonas.map(p => p.personaId);
  try {
    return validateClusterQuotes(raw, expectedIds);
  } catch (err) {
    console.warn(`   [WARN] Cluster quote validation failed for "${cluster.text}":`, (err as Error).message);
    return [];
  }
}

// ─── Sub-step C: Wildcard Quote Generation ────────────────────────────────────

async function enrichWildcardQuote(
  wildcard: WildCard,
  rawData: RawSurveyData,
  topicText: string
) {
  const persona = selectPersonaForWildcard(wildcard, rawData);
  const prompt = buildWildcardQuotePrompt({
    personaId: persona.personaId,
    personaName: persona.personaName,
    toneOfVoice: persona.toneOfVoice,
    rawAnswer: wildcard.rawAnswer || persona.rawAnswer,
    topicText,
  });

  const { data: raw } = await callLMStudioWithRetry<unknown>(
    prompt,
    MODEL_SMALL_PARALLEL,
    0.7,
    200,
    3,
    'enrichment_wildcard_quote',
    wildcardQuoteJobSchema
  );

  try {
    return validateWildcardQuote(raw);
  } catch (err) {
    console.warn(`   [WARN] Wildcard quote validation failed for "${wildcard.personaId}":`, (err as Error).message);
    return { personaName: persona.personaName, text: 'No quote generated.' };
  }
}

// ─── Pool utility ────────────────────────────────────────────────────────────

/** Runs async tasks with max concurrency */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── processTopic ─────────────────────────────────────────────────────────────

async function processTopic(
  topicId: string,
): Promise<void> {
  // Load the latest clustered file
  const latestPath = `${OUTPUT_DIR}/${topicId}.json`;
  if (!fs.existsSync(latestPath)) {
    console.warn(`   [SKIP] No clustered output found for topic "${topicId}". Run cluster.ts first.`);
    return;
  }

  const surveyResult = await loadJson<SurveyResult>(latestPath);

  // Load matching raw survey data for persona lookup
  const rawPath = `${OUTPUT_RAW_DIR}/${topicId}.json`;
  if (!fs.existsSync(rawPath)) {
    console.warn(`   [SKIP] No raw survey data found for topic "${topicId}".`);
    return;
  }
  const rawData = await loadJson<RawSurveyData>(rawPath);

  console.log(`   Clusters: ${surveyResult.clusters.length} | Wildcards: ${surveyResult.wildcards.length}`);

  // ── Sub-step A + B: Parallel cluster enrichment ──────────────────────────

  console.log(`   [A] Generating synonyms for ${surveyResult.clusters.length} clusters...`);
  const synonymTasks = surveyResult.clusters.map(cluster => () =>
    enrichClusterSynonyms(cluster, surveyResult.topicText)
  );
  const allSynonyms = await runWithConcurrency(synonymTasks, CONCURRENCY_LIMIT);

  console.log(`   [B] Generating quotes for ${surveyResult.clusters.length} clusters...`);
  const clusterQuoteTasks = surveyResult.clusters.map(cluster => () =>
    enrichClusterQuotes(cluster, rawData, surveyResult.topicText)
  );
  const allClusterQuotes = await runWithConcurrency(clusterQuoteTasks, CONCURRENCY_LIMIT);

  const enrichedClusters: AnswerCluster[] = surveyResult.clusters.map((cluster, i) => ({
    ...cluster,
    synonyms: allSynonyms[i],
    flavorQuotes: allClusterQuotes[i],
  }));

  // ── Sub-step C: Parallel wildcard quote enrichment ────────────────────────

  console.log(`   [C] Generating quotes for ${surveyResult.wildcards.length} wildcards...`);
  const wildcardQuoteTasks = surveyResult.wildcards.map(wildcard => () =>
    enrichWildcardQuote(wildcard, rawData, surveyResult.topicText)
  );
  const allWildcardQuotes = await runWithConcurrency(wildcardQuoteTasks, CONCURRENCY_LIMIT);

  const enrichedWildcards: WildCard[] = surveyResult.wildcards.map((wildcard, i) => ({
    ...wildcard,
    flavorQuote: allWildcardQuotes[i],
  }));

  // ── Sub-step D: Assembly ──────────────────────────────────────────────────

  const finalResult = assembleFinalResult(surveyResult, enrichedClusters, enrichedWildcards);

  const outputPath = getNextVersionPath(latestPath);
  writeJson(outputPath, finalResult);
  console.log(`   Saved enriched result to ${outputPath}`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { limit, topicId: specificTopicId, runMissing } = parseCliArgs(process.argv.slice(2));

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);

  let topicsToProcess = topics;

  if (specificTopicId) {
    topicsToProcess = topics.filter(t => t.id === specificTopicId);
    if (topicsToProcess.length === 0) {
      console.error(`Error: Topic ID "${specificTopicId}" not found in topics-v1.json`);
      process.exit(1);
    }
  } else if (runMissing) {
    topicsToProcess = topics.filter(topic => {
      const outputExists = fs.existsSync(`${OUTPUT_DIR}/${topic.id}.json`);
      if (!outputExists) return false;

      // Check if the latest clustered file lacks enrichedAt
      try {
        const data = JSON.parse(
          fs.readFileSync(`${OUTPUT_DIR}/${topic.id}.json`, 'utf-8')
        ) as Partial<SurveyResult>;
        return !data.enrichedAt;
      } catch {
        return false;
      }
    });
    console.log(`Found ${topicsToProcess.length} topics with clustered output but not yet enriched.`);
  }

  if (limit) {
    topicsToProcess = topicsToProcess.slice(0, limit);
  }

  console.log(`Enriching ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Enriching topic: ${topic.id} ===`);
    try {
      await processTopic(topic.id);
    } catch (error) {
      console.error(`Error enriching ${topic.id}:`, error);
    }
  }

  console.log('\n=== Enrichment complete ===');
}

main().catch(console.error);
