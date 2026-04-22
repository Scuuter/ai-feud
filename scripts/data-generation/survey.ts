import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  DATA_DIR,
  OUTPUT_RAW_DIR,
  DEMOGRAPHIC_NAME,
  DATA_VERSION,
} from "./config.js";
import { Topic, Persona, RawResponse } from "./types.js";
import { loadJson, ensureDir, writeJson, fileExists, buildOutputFilename, buildOutputDir } from "./utils/fs.js";
import { callLMStudioWithRetry } from "./utils/llm.js";
import { renderProgressBar } from "./utils/progress.js";
import { runWithConcurrency } from './utils/concurrency.js';
import { parseCliArgs } from "./utils/cli.js";
import { buildSurveyPrompt } from "./lib/prompts/survey-prompts.js";

async function runSurvey(topic: Topic, personas: Persona[], demographicContext?: string): Promise<RawResponse[]> {
  const tasks = personas.map((persona) => async (): Promise<RawResponse> => {
    const prompt = buildSurveyPrompt({
      personaDescription: persona.description,
      topicAiPrompt: topic.aiPrompt,
      demographicContext,
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
  const { limit, topicId, runMissing, demographic } = parseCliArgs(process.argv.slice(2));

  const topics = await loadJson<Topic[]>(`${DATA_DIR}/topics-v1.json`);

  // Resolve personas file and demographic name
  const personasFile = demographic
    ? `${DATA_DIR}/personas-${demographic}.json`
    : `${DATA_DIR}/personas-v1.json`;
  const demographicName = demographic ?? DEMOGRAPHIC_NAME;

  const allPersonas = await loadJson<Persona[]>(personasFile);

  // Filter by demographic tag when specified
  const personas = demographic
    ? allPersonas.filter(p => p.demographics.includes(demographic))
    : allPersonas;

  if (demographic && personas.length === 0) {
    console.error(`Error: No personas found with demographic tag "${demographic}" in ${personasFile}`);
    process.exit(1);
  }

  console.log(`Using ${personas.length} personas for demographic "${demographicName}"`);

  const rawDir = buildOutputDir(OUTPUT_RAW_DIR, demographicName);
  ensureDir(rawDir);

  let topicsToProcess = topics;
  if (topicId) {
    topicsToProcess = topics.filter(t => t.id === topicId);
    if (topicsToProcess.length === 0) {
      console.error(`Error: Topic ID "${topicId}" not found in topics-v1.json`);
      process.exit(1);
    }
  } else if (runMissing) {
    topicsToProcess = topics.filter(topic => {
      const filename = buildOutputFilename(topic.id, demographicName, DATA_VERSION);
      return !fileExists(`${rawDir}/${filename}`);
    });
    console.log(`Found ${topicsToProcess.length} topics missing raw data.`);
  }

  if (limit) {
    topicsToProcess = topicsToProcess.slice(0, limit);
  }

  console.log(`Processing ${topicsToProcess.length} topics...`);

  for (const topic of topicsToProcess) {
    console.log(`\n=== Processing topic: ${topic.id} ===`);

    const rawResponses = await runSurvey(topic, personas, demographic);

    const output = {
      topicId: topic.id,
      demographicName,
      rawResponses,
    };

    const filename = buildOutputFilename(topic.id, demographicName, DATA_VERSION);
    const outputPath = `${rawDir}/${filename}`;
    await writeJson(outputPath, output);
    console.log(`Saved to ${outputPath}`);
  }

  console.log("\n=== Survey complete ===");
}

main().catch(console.error);
