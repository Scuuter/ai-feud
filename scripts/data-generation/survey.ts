import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  DATA_DIR,
  OUTPUT_RAW_DIR,
} from "./config.js";
import { Topic, Persona, LLMResponse, RawResponse } from "./types.js";
import { loadJson, ensureDir, writeJson } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { renderProgressBar } from "./utils/progress.js";

async function runSurvey(
  topic: Topic,
  personas: Persona[],
): Promise<Array<RawResponse>> {
  const results: Array<RawResponse> = [];

  for (let i = 0; i < personas.length; i += CONCURRENCY_LIMIT) {
    const batch = personas.slice(i, i + CONCURRENCY_LIMIT);
    process.stdout.write(`\rSurveying Personas: ${renderProgressBar(Math.min(i + CONCURRENCY_LIMIT, personas.length), personas.length)}`);

    const promises = batch.map(async (persona) => {
      const prompt = `You are ${persona.description}. Answer the topic: ${topic["prompt-ai"]}. Respond in 1-4 words. Output JSON: \`{ "answer": "..." }\`.`;

      try {
        const { data: response } = await callLMStudioWithRetry<LLMResponse>(
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
  const args = process.argv.slice(2);
  const limit = args.includes("--limit")
    ? parseInt(args[args.indexOf("--limit") + 1], 10)
    : undefined;

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);
  const personas = await loadJson<Persona[]>(`${DATA_DIR}/personas-v1.json`);

  ensureDir(OUTPUT_RAW_DIR);

  const topicsToProcess = limit ? topics.slice(0, limit) : topics;
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
