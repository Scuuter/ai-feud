import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  DATA_DIR,
  OUTPUT_RAW_DIR,
  DEMOGRAPHIC_NAME,
} from "./config.js";
import { Topic, Persona, RawResponse } from "./types.js";
import { loadJson, ensureDir, writeJson, fileExists } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { renderProgressBar } from "./utils/progress.js";
import { runWithConcurrency } from './utils/concurrency.js';
import { parseCliArgs } from "./utils/cli.js";
import { buildSurveyPrompt } from "./lib/prompts/survey-prompts.js";

async function runSurvey(topic: Topic, personas: Persona[]): Promise<RawResponse[]> {
  const tasks = personas.map((persona) => async (): Promise<RawResponse> => {
    const prompt = buildSurveyPrompt({
      personaDescription: persona.description,
      topicAiPrompt: topic.aiPrompt,
    });
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
        text: 'ERROR',
      };
    }
  });

  const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT, (done, total) => {
    process.stdout.write(`\rSurveying Personas: ${renderProgressBar(done, total)}`);
  });

  console.log(); // newline after progress bar
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
      const rawExists = fileExists(`${OUTPUT_RAW_DIR}/${topic.id}.json`);
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
      demographicName: DEMOGRAPHIC_NAME,
      rawResponses,
    };

    const outputPath = `${OUTPUT_RAW_DIR}/${topic.id}.json`;
    await writeJson(outputPath, output);
    console.log(`Saved to ${outputPath}`);
  }

  console.log("\n=== Survey complete ===");
}

main().catch(console.error);
