import crypto from "node:crypto";
import {
  MODEL_CLUSTER,
  MODEL_SURVEY,
  QUOTES_PER_CLUSTER,
  DATA_DIR,
  OUTPUT_DIR,
  OUTPUT_RAW_DIR,
} from "./config.js";
import {
  Topic,
  RawSurveyData,
  SurveyResultDocument,
  FlavorQuote,
  AnswerCluster,
  WildCard,
  ClusterResult,
  QuoteResponse,
} from "./types.js";
import { loadJson, ensureDir, writeJson } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { normalizeScoresTo100 } from "./lib/normalization.js";
import { renderProgressBar } from "./utils/progress.js";

async function clusterResponses(
  rawData: RawSurveyData,
): Promise<ClusterResult> {
  const answersList = JSON.stringify(
    rawData.rawResponses.map((r) => ({ id: r.personaId, text: r.text })),
    null,
    2
  );

  const prompt = `You are a semantic clustering algorithm. Group the following ${rawData.rawResponses.length} answers into 5-8 clusters.

Analyze the semantic overlap of the answers. Decide which ones fit into broad categories and which ones are too unique and belong in wildcards. Output ONLY valid JSON.

Rules:
1. Each cluster must have >= 3 answers
2. Create a canonical "text" for each cluster
3. Answers with < 3 similar responses go to "wildcardPersonaIds"

Input answers (JSON array of objects with id and text):
${answersList}

Output JSON:
{
  "clusters": [
    {
      "text": "canonical answer",
      "personaIds": ["id1", "id2"]
    }
  ],
  "wildcardPersonaIds": ["id3", "id4"]
}`;

  const topicLabel = rawData.rawResponses[0]?.personaId?.split('-')[0] || 'unknown';
  const { data: result } = await callLMStudioWithRetry<ClusterResult>(
    prompt,
    MODEL_CLUSTER,
    0.3,
    20000,
    undefined,
    'cluster_' + topicLabel,
  );
  return result;
}

async function generateQuote(
  personaName: string,
  toneOfVoice: string,
  answer: string,
): Promise<FlavorQuote> {
  const prompt = `You are ${personaName}. Your tone of voice: ${toneOfVoice}. You answered "${answer}". Give a 1-sentence quote explaining why. Output JSON: \`{ "quote": "..." }\`.`;

  try {
    const { data: result } = await callLMStudioWithRetry<QuoteResponse>(
      prompt,
      MODEL_SURVEY,
      0.8,
      1000,
      undefined,
      'quote_' + personaName.replace(/\s+/g, '-'),
    );
    return {
      personaName,
      text: result.quote,
    };
  } catch (error) {
    console.error(`Error generating quote for answer "${answer}":`, error);
    return {
      personaName,
      text: `Someone answered: "${answer}"`,
    };
  }
}

async function generateQuotesForCluster(
  personaIds: string[],
  rawData: RawSurveyData,
): Promise<FlavorQuote[]> {
  const quotes: FlavorQuote[] = [];
  const sampleSize = Math.min(QUOTES_PER_CLUSTER, personaIds.length);

  for (let i = 0; i < sampleSize; i++) {
    const personaId = personaIds[i];
    const matchingResponse = rawData.rawResponses.find(
      (r) => r.personaId === personaId,
    );
    if (!matchingResponse) continue;

    const personaName = matchingResponse.personaName;
    const toneOfVoice = matchingResponse.toneOfVoice;
    quotes.push(await generateQuote(personaName, toneOfVoice, matchingResponse.text));
    process.stdout.write(`\r   -> Quotes generated: ${renderProgressBar(i + 1, sampleSize)}`);
  }
  console.log();

  return quotes;
}

async function processTopic(
  topicId: string,
  topicText: string,
): Promise<SurveyResultDocument> {
  const rawPath = `${OUTPUT_RAW_DIR}/${topicId}.json`;

  const rawData = await loadJson<RawSurveyData>(rawPath);
  console.log(
    `Processing ${topicId} with ${rawData.rawResponses.length} responses`,
  );

  console.log(
    `1. Semantic Clustering: [Running Gemma 4...] (This takes ~15-30 seconds)`,
  );
  const clusterResult = await clusterResponses(rawData);
  console.log(
    `   -> Found ${clusterResult.clusters.length} clusters and ${clusterResult.wildcardPersonaIds.length} wildcards`,
  );

  const rawCounts = clusterResult.clusters.map((c) => c.personaIds.length);
  const normalizedScores = normalizeScoresTo100(rawCounts);

  console.log(`2. Generating Flavor Quotes for Clusters...`);
  const clusters: AnswerCluster[] = [];
  for (let i = 0; i < clusterResult.clusters.length; i++) {
    const cluster = clusterResult.clusters[i];
    const quotes = await generateQuotesForCluster(cluster.personaIds, rawData);

    clusters.push({
      text: cluster.text,
      score: normalizedScores[i],
      synonyms: [], // TODO: Implement separate synonym generation pass
      flavorQuotes: quotes,
    });
  }

  clusters.sort((a, b) => b.score - a.score);

  console.log(`3. Generating Flavor Quotes for Wildcards...`);
  const wildcards: WildCard[] = [];

  for (let i = 0; i < clusterResult.wildcardPersonaIds.length; i++) {
    const personaId = clusterResult.wildcardPersonaIds[i];
    const matchingResponse = rawData.rawResponses.find(
      (r) => r.personaId === personaId,
    );
    if (!matchingResponse) continue;

    const personaName = matchingResponse.personaName;
    const toneOfVoice = matchingResponse.toneOfVoice;
    const flavorQuote = await generateQuote(
      personaName,
      toneOfVoice,
      matchingResponse.text,
    );

    wildcards.push({
      synonyms: [], // TODO: Implement separate synonym generation pass
      flavorQuote,
    });
    process.stdout.write(`\r   -> Wildcards processed: ${renderProgressBar(i + 1, clusterResult.wildcardPersonaIds.length)}`);
  }
  console.log();

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

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);
  ensureDir(OUTPUT_DIR);

  const topicsToProcess = limit ? topics.slice(0, limit) : topics;
  console.log(`Processing ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Processing topic: ${topic.id} ===`);

    try {
      const result = await processTopic(topic.id, topic["text-ui"]);
      const outputPath = `${OUTPUT_DIR}/${topic.id}.json`;
      writeJson(outputPath, result);
      console.log(`Saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${topic.id}:`, error);
    }
  }

  console.log("\n=== Clustering complete ===");
}

main().catch(console.error);
