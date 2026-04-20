import fs from "node:fs";
import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  DATA_DIR,
  OUTPUT_RAW_DIR,
} from "./config.js";
import { Topic, Persona, RawResponse } from "./types.js";
import { loadJson, ensureDir, writeJson } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { renderProgressBar } from "./utils/progress.js";
import { parseCliArgs } from "./utils/cli.js";

async function runSurvey(
  topic: Topic,
  personas: Persona[],
): Promise<Array<RawResponse>> {
  const results: Array<RawResponse> = [];

  for (let i = 0; i < personas.length; i += CONCURRENCY_LIMIT) {
    const batch = personas.slice(i, i + CONCURRENCY_LIMIT);
    process.stdout.write(`\rSurveying Personas: ${renderProgressBar(Math.min(i + CONCURRENCY_LIMIT, personas.length), personas.length)}`);

    const promises = batch.map(async (persona) => {
      const prompt = `You are ${persona.description}. Answer the topic: ${topic.aiPrompt}. Respond in 1-4 words. Output JSON: \`{ "answer": "..." }\`.`;

      try {
        const { data: response } = await callLMStudioWithRetry<{ answer: string }>(
          prompt,
          MODEL_SMALL_PARALLEL,
          0.8,
          100,
          undefined,
          'survey_' + persona.id,
        );
        return {
          personaId: persona.id,
          personaName: persona.name,
          toneOfVoice: persona.toneOfVoice,
          text: response.answer,
        };
      } catch (error) {
        console.error(`Error for persona ${persona.id}:`, error);
        return {
          personaId: persona.id,
          personaName: persona.name,
          toneOfVoice: persona.toneOfVoice,
          text: "ERROR",
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  console.log(); // Add newline after progress bar completes
  return results;
}

async function main() {
  const { limit, topicId, runMissing } = parseCliArgs(process.argv.slice(2));

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);
  const personas = await loadJson<Persona[]>(`${DATA_DIR}/personas-v1.json`);

  ensureDir(OUTPUT_RAW_DIR);

  let topicsToProcess = topics;
  if (topicId) {
    topicsToProcess = topics.filter(t => t.id === topicId);
    if (topicsToProcess.length === 0) {
      console.error(`Error: Topic ID "${topicId}" not found in topics-v1.json`);
      process.exit(1);
    }
  } else if (runMissing) {
    topicsToProcess = topics.filter(topic => {
      const rawExists = fs.existsSync(`${OUTPUT_RAW_DIR}/${topic.id}.json`);
      return !rawExists;
    });
    console.log(`Found ${topicsToProcess.length} topics missing raw data.`);
  }

  if (limit) {
    topicsToProcess = topicsToProcess.slice(0, limit);
  }

  console.log(`Processing ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Processing topic: ${topic.id} ===`);

    const rawResponses = await runSurvey(topic, personas);

    const output = {
      topicId: topic.id,
      demographicName: "demo-v1",
      rawResponses,
    };

    const outputPath = `${OUTPUT_RAW_DIR}/${topic.id}.json`;
    await writeJson(outputPath, output);
    console.log(`Saved to ${outputPath}`);
  }

  console.log("\n=== Survey complete ===");
}

main().catch(console.error);
