import crypto from "node:crypto";
import {
  MODEL_CLUSTER,
  MODEL_SURVEY,
  QUOTES_PER_CLUSTER,
  MAX_WILDCARDS,
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

async function clusterResponses(
  rawData: RawSurveyData,
): Promise<ClusterResult> {
  const answersList = rawData.rawResponses
    .map((r) => `"${r.text}"`)
    .join(",\n");

  const prompt = `You are a semantic clustering algorithm. Group these 100 answers into 5-8 clusters.

Before outputting the JSON, use <|think|> tags to analyze the semantic overlap of the answers. Decide which ones fit into broad categories and which ones are too unique and belong in wildcards. Then, output ONLY valid JSON after the think block.

Rules:
1. Each cluster must have >= 3 answers
2. Create a canonical "text" for each cluster
3. Generate "synonyms" array (valid variations for matching)
4. Answers with < 3 similar responses go to "wildcards"

Input answers (format: "answer"):
${answersList}

Output JSON:
{
  "clusters": [
    {
      "text": "canonical answer",
      "synonyms": ["variant1", "variant2"],
      "rawAnswers": ["raw answer 1", "raw answer 2", "..."]
    }
  ],
  "wildcards": ["unique answer 1", "unique answer 2"]
}`;

  const result = await callLMStudioWithRetry<ClusterResult>(
    prompt,
    MODEL_CLUSTER,
    0.3,
    2000,
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
    const result = await callLMStudioWithRetry<QuoteResponse>(
      prompt,
      MODEL_SURVEY,
      0.8,
      150,
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
  clusterAnswers: string[],
  rawData: RawSurveyData,
): Promise<FlavorQuote[]> {
  const quotes: FlavorQuote[] = [];
  const sampleSize = Math.min(QUOTES_PER_CLUSTER, clusterAnswers.length);

  for (let i = 0; i < sampleSize; i++) {
    const answer = clusterAnswers[i];
    const matchingResponse = rawData.rawResponses.find(
      (r) => r.text.toLowerCase() === answer.toLowerCase(),
    );
    const personaName = matchingResponse?.personaName ?? "Unknown";
    const toneOfVoice = matchingResponse?.toneOfVoice ?? "Neutral";
    quotes.push(await generateQuote(personaName, toneOfVoice, answer));
  }

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

  const clusterResult = await clusterResponses(rawData);
  console.log(
    `Found ${clusterResult.clusters.length} clusters and ${clusterResult.wildcards.length} wildcards`,
  );

  const rawCounts = clusterResult.clusters.map((c) => c.rawAnswers.length);
  const normalizedScores = normalizeScoresTo100(rawCounts);

  const clusters: AnswerCluster[] = [];
  for (let i = 0; i < clusterResult.clusters.length; i++) {
    const cluster = clusterResult.clusters[i];
    const quotes = await generateQuotesForCluster(cluster.rawAnswers, rawData);

    clusters.push({
      text: cluster.text,
      score: normalizedScores[i],
      synonyms: cluster.synonyms,
      flavorQuotes: quotes,
    });
  }

  clusters.sort((a, b) => b.score - a.score);

  const wildcards: WildCard[] = [];
  for (const wildcardText of clusterResult.wildcards.slice(0, MAX_WILDCARDS)) {
    const matchingResponse = rawData.rawResponses.find(
      (r) => r.text.toLowerCase() === wildcardText.toLowerCase(),
    );

    const personaName = matchingResponse?.personaName ?? "Unknown";
    const toneOfVoice = matchingResponse?.toneOfVoice ?? "Neutral";
    const flavorQuote = await generateQuote(
      personaName,
      toneOfVoice,
      wildcardText,
    );

    wildcards.push({
      synonyms: [wildcardText.toLowerCase()],
      flavorQuote,
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
