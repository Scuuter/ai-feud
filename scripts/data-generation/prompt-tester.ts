/**
 * prompt-tester.ts — Interactive Prompt Tuning CLI
 *
 * Semi-manual tool for testing individual prompts against a live LM Studio instance.
 * No file I/O — purely interactive inspection.
 *
 * Usage:
 *   npx tsx scripts/data-generation/prompt-tester.ts --list
 *   npx tsx scripts/data-generation/prompt-tester.ts --prompt enrichment:cluster-synonyms
 *   npx tsx scripts/data-generation/prompt-tester.ts --prompt cluster:extract-categories --fixture '{"topicText":"..."}'
 *
 * NOTE: Requires a running LM Studio instance. Do NOT run this in CI.
 */
import { LM_STUDIO_URL } from './config.js';
import { PROMPT_REGISTRY } from './lib/prompts/prompt-registry.js';
import { callLMStudio } from './utils/llm.js';

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  list: boolean;
  promptKey: string | undefined;
  fixtureOverride: Record<string, unknown> | undefined;
} {
  const list = argv.includes('--list');
  const promptIdx = argv.indexOf('--prompt');
  const promptKey = promptIdx !== -1 ? argv[promptIdx + 1] : undefined;
  const fixtureIdx = argv.indexOf('--fixture');
  let fixtureOverride: Record<string, unknown> | undefined;

  if (fixtureIdx !== -1 && argv[fixtureIdx + 1]) {
    try {
      fixtureOverride = JSON.parse(argv[fixtureIdx + 1]) as Record<string, unknown>;
    } catch {
      console.error('[ERROR] --fixture value is not valid JSON');
      process.exit(1);
    }
  }

  return { list, promptKey, fixtureOverride };
}

// ─── List command ─────────────────────────────────────────────────────────────

function printList(): void {
  const sep = '─'.repeat(60);
  console.log('\n' + sep);
  console.log('  Available Prompts');
  console.log(sep);
  for (const [key, descriptor] of Object.entries(PROMPT_REGISTRY)) {
    console.log(`  \x1b[36m${key}\x1b[0m`);
    console.log(`    ${descriptor.description}`);
    console.log(`    Model: ${descriptor.suggestedModel} | Temp: ${descriptor.suggestedTemperature} | MaxTokens: ${descriptor.suggestedMaxTokens}`);
    console.log();
  }
  console.log(sep + '\n');
}

// ─── Run command ──────────────────────────────────────────────────────────────

async function runPrompt(
  key: string,
  fixtureOverride?: Record<string, unknown>
): Promise<void> {
  const descriptor = PROMPT_REGISTRY[key];
  if (!descriptor) {
    console.error(`[ERROR] Unknown prompt key: "${key}"`);
    console.error('Run with --list to see available prompts.');
    process.exit(1);
  }

  const fixture = fixtureOverride ?? descriptor.defaultFixture;
  const prompt = descriptor.build(fixture);

  const sep = '═'.repeat(60);
  console.log('\n' + sep);
  console.log('  PROMPT');
  console.log(sep);
  console.log(prompt);
  console.log(sep + '\n');

  console.log(`Running against LM Studio (${LM_STUDIO_URL})...`);
  console.log(`  Model: ${descriptor.suggestedModel} | Temp: ${descriptor.suggestedTemperature} | MaxTokens: ${descriptor.suggestedMaxTokens}\n`);

  // Determine model string — prompt-tester uses registry model hints
  // In a real setup you'd resolve from config; for now we pass the hint string
  // and let the user configure LM Studio to have the right model loaded.
  const modelHint = descriptor.suggestedModel === 'large'
    ? (process.env.MODEL_LARGE_REASONING ?? 'large-model')
    : (process.env.MODEL_SMALL_PARALLEL ?? 'small-model');

  let result: { data: unknown };
  try {
    result = await callLMStudio<unknown>(
      prompt,
      modelHint,
      descriptor.suggestedTemperature,
      descriptor.suggestedMaxTokens,
      `prompt-tester:${key}`,
      descriptor.schema,
    );
  } catch (err) {
    console.error('\n[ERROR] LM Studio call failed:', (err as Error).message);
    process.exit(1);
  }

  console.log('\n' + sep);
  console.log('  PARSED OUTPUT');
  console.log(sep);
  console.log(JSON.stringify(result.data, null, 2));
  console.log(sep + '\n');
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { list, promptKey, fixtureOverride } = parseArgs(process.argv.slice(2));

  if (list) {
    printList();
    return;
  }

  if (!promptKey) {
    console.error('[ERROR] You must provide --list or --prompt <key>');
    process.exit(1);
  }

  await runPrompt(promptKey, fixtureOverride);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
