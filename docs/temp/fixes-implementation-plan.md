# Layer A Pipeline — Hardening Implementation Plan

## Goal

Fix the structural issues identified in the pipeline code review:
concurrency unification, constant extraction, debug path bug,
type ownership, and deterministic IDs.

---

## Relevant Source Files

| File | Role |
|---|---|
| [config.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/config.ts) | Pipeline constants — source of truth |
| [types.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/types.ts) | Domain types |
| [utils/llm.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/llm.ts) | `callLMStudio`, `callLMStudioWithRetry`, `dumpDebugFile` |
| [utils/fs.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/fs.ts) | `loadJson`, `writeJson`, `getNextDebugRunDir` |
| [utils/progress.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/progress.ts) | `renderProgressBar` |
| [survey.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/survey.ts) | Orchestrator — Step 1 |
| [cluster.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/cluster.ts) | Orchestrator — Step 2 |
| [enrichment.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/enrichment.ts) | Orchestrator — Step 3 |
| [lib/enrichment.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/lib/enrichment.ts) | Pure enrichment helpers |
| [lib/prompts/quotes-prompts.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/lib/prompts/quotes-prompts.ts) | Quote prompt builders + `SelectedPersona` |

---

## Concurrency: Current Problem in `survey.ts`

`survey.ts` uses a **wave/batch pattern**:

```typescript
for (let i = 0; i < personas.length; i += CONCURRENCY_LIMIT) {
  const batch = personas.slice(i, i + CONCURRENCY_LIMIT);
  // update progress bar (BEFORE tasks complete — inaccurate)
  await Promise.all(batch.map(persona => callLMStudio(...)));
}
```

**Problems:**
1. A single slow LLM response in a batch of 8 stalls all 8 slots until it finishes. The next wave cannot start until the slowest task in the current wave completes.
2. Progress is reported optimistically at the *start* of each wave, not on actual completion.
3. The same wave pattern is used in `cluster.ts`'s Reduce stage (lines 93–136) with an additional nesting level for chunk building.

`enrichment.ts` already has the correct **worker-pool pattern** (`runWithConcurrency`):
- `N` workers each independently pick the next available task.
- As soon as one task finishes a worker starts the next — no idle slots.
- Progress can be reported accurately on each completion.

The worker-pool pattern is correct for all homogeneous LLM task lists in this pipeline.

---

## Proposed Changes

---

### 1 — `config.ts` — Add three constants

#### [MODIFY] [config.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/config.ts)

Add after `OUTPUT_RAW_DIR`:

```typescript
/** Absolute path to the debug dump directory, shared by llm.ts and cluster.ts */
export const DEBUG_OUTPUT_DIR = path.join(__dirname, "../output/debug");

/** How many flavor quotes to generate per AnswerCluster */
export const QUOTES_PER_CLUSTER = parseInt(process.env.QUOTES_PER_CLUSTER ?? "2", 10);

/** Demographic identifier written into RawSurveyData by survey.ts */
export const DEMOGRAPHIC_NAME = process.env.DEMOGRAPHIC_NAME ?? "demo-v1";
```

> [!IMPORTANT]
> `DEBUG_OUTPUT_DIR` resolves to `{repo}/scripts/output/debug` (same as llm.ts currently resolves via its own `__dirname_llm`). This is confirmed correct — the `tree` command in AGENTS.md excludes `scripts/output/debug`, which is the active write location.

---

### 2 — `utils/concurrency.ts` — New file

#### [NEW] [concurrency.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/concurrency.ts)

```typescript
/**
 * concurrency.ts — Generic worker-pool concurrency utility.
 *
 * Runs up to `concurrency` async tasks at a time. As each task
 * finishes a worker immediately picks up the next one — no idle slots.
 * Preserves result order matching the input tasks array.
 *
 * @param tasks      Array of zero-argument async factory functions.
 * @param concurrency Maximum number of tasks running simultaneously.
 * @param onProgress Optional callback fired after each task completes.
 *                   Receives (completedCount, totalCount).
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
      completed++;
      onProgress?.(completed, tasks.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
```

---

### 3 — `utils/llm.ts` — Import `DEBUG_OUTPUT_DIR` from config

#### [MODIFY] [llm.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/llm.ts)

**Remove** the local `DEBUG_DIR` computation (lines 7–9):
```typescript
// DELETE these three lines:
const __filename_llm = fileURLToPath(import.meta.url);
const __dirname_llm = path.dirname(__filename_llm);
const DEBUG_DIR = path.join(__dirname_llm, '../../output/debug');
```

**Add** an import of `DEBUG_OUTPUT_DIR` from config. Also remove the now-unused `fileURLToPath` import if no longer needed.

```typescript
import { LM_STUDIO_URL, MAX_RETRIES, DEBUG_OUTPUT_DIR } from '../config.js';
```

Replace all references to `DEBUG_DIR` with `DEBUG_OUTPUT_DIR` inside `dumpDebugFile`.

> [!IMPORTANT]
> Do NOT change `path` or `fs` imports — they are still used elsewhere in the file. Only remove the three lines that compute `DEBUG_DIR` locally.

---

### 4 — `utils/fs.ts` — Add `loadJsonSync`

#### [MODIFY] [fs.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/utils/fs.ts)

The `enrichment.ts` `--missing` filter uses `JSON.parse(fs.readFileSync(...))` inline because `loadJson` is async and cannot be used inside `Array.filter()`. Add a synchronous counterpart:

```typescript
/** Synchronous variant of loadJson — use only when an async context is unavailable (e.g. inside Array.filter). */
export function loadJsonSync<T>(filepath: string): T {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as T;
}
```

---

### 5 — `types.ts` — Add `SelectedPersona`

#### [MODIFY] [types.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/types.ts)

`SelectedPersona` is a domain type (a resolved persona with raw answer data) currently living in `lib/prompts/quotes-prompts.ts`. This causes a reversed dependency: `lib/enrichment.ts` (pure domain logic) imports from a prompt module.

Add to `types.ts`, after `RawResponse`:

```typescript
/** A persona resolved from rawData for use in quote/synonym generation. */
export interface SelectedPersona {
  personaId: string;
  personaName: string;
  toneOfVoice: string;
  rawAnswer: string;
}
```

---

### 6 — `lib/prompts/quotes-prompts.ts` — Remove `SelectedPersona`, import from types

#### [MODIFY] [quotes-prompts.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/lib/prompts/quotes-prompts.ts)

Remove the `SelectedPersona` interface definition (lines 50–55).

Add import at top of file:
```typescript
import type { SelectedPersona } from '../../types.js';
export type { SelectedPersona }; // re-export so existing callers don't break
```

The re-export means callers currently importing `SelectedPersona` from `quotes-prompts.ts` (like `lib/enrichment.ts`) will still compile without change. Update those imports as a follow-on separately if desired.

---

### 7 — `survey.ts` — Replace wave pattern with worker pool

#### [MODIFY] [survey.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/survey.ts)

**Imports to add:**
```typescript
import { runWithConcurrency } from './utils/concurrency.js';
import { DEMOGRAPHIC_NAME } from './config.js';   // replaces hardcoded "demo-v1"
```

**Replace `runSurvey`** (lines 15–63) with:

```typescript
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
```

**In `main()`**, replace the hardcoded `demographicName: "demo-v1"` with `demographicName: DEMOGRAPHIC_NAME`.

Remove the top-level `import fs from "node:fs"` — verify it is no longer needed after the `runMissing` logic (which uses `fs.existsSync`) — keep it if still needed there.

---

### 8 — `cluster.ts` — Three targeted fixes

#### [MODIFY] [cluster.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/cluster.ts)

**Fix A — Remove local `DEBUG_BASE`, import from config**

Delete lines 35–36:
```typescript
// DELETE:
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_BASE = path.join(__dirname, "../../output/debug");
```

Add `DEBUG_OUTPUT_DIR` to the config import:
```typescript
import {
  ...
  DEBUG_OUTPUT_DIR,
} from './config.js';
```

Update the `getNextDebugRunDir` call in `processTopic`:
```typescript
const debugSubDir = getNextDebugRunDir(topicId, DEBUG_OUTPUT_DIR);
```

Remove the now-unused `fileURLToPath` import (and `path` import if no longer needed).

**Fix B — Replace Reduce wave pattern with worker pool**

Add import:
```typescript
import { runWithConcurrency } from './utils/concurrency.js';
```

Replace the nested for-loop in `assignClusters` (lines 93–137) with:

```typescript
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
```

**Fix C — Deterministic `SurveyResult.id`**

In `processTopic`, replace:
```typescript
id: crypto.randomUUID(),
```
with:
```typescript
id: topicId,
```

Remove `import crypto from "node:crypto"` — verify it is unused after this change.

> [!IMPORTANT]
> Existing generated `.json` files in `output/` will have UUID ids. After this change, re-running `cluster.ts` for any topic produces a file with `id: topicId`. The game engine should use `topicId` (the filename key) as the stable lookup — not the embedded `id` field. No migration of existing files is required; they will simply be overwritten on next run.

---

### 9 — `enrichment.ts` — Three targeted fixes

#### [MODIFY] [enrichment.ts](file:///Users/scuuter/dev/scuuter/ai-feud/scripts/data-generation/enrichment.ts)

**Fix A — Remove inline `runWithConcurrency`, import from utils**

Delete lines 149–169 (the entire `runWithConcurrency` function and its block comment).

Add import:
```typescript
import { runWithConcurrency } from './utils/concurrency.js';
```

**Fix B — Import `QUOTES_PER_CLUSTER` from config**

Add to config import block:
```typescript
import {
  MODEL_SMALL_PARALLEL,
  CONCURRENCY_LIMIT,
  OUTPUT_DIR,
  OUTPUT_RAW_DIR,
  DATA_DIR,
  QUOTES_PER_CLUSTER,   // ← add
} from './config.js';
```

Delete the local constant at line 56:
```typescript
// DELETE:
const QUOTES_PER_CLUSTER = 2;
```

**Fix C — Replace raw `fs` call in `--missing` with `loadJsonSync`**

Add to the `utils/fs.js` import:
```typescript
import { loadJson, writeJson, getNextVersionPath, loadJsonSync } from './utils/fs.js';
```

In `main()`, replace the inline `JSON.parse(fs.readFileSync(...))` block (lines 258–264):
```typescript
// BEFORE:
const data = JSON.parse(
  fs.readFileSync(`${OUTPUT_DIR}/${topic.id}.json`, 'utf-8')
) as Partial<SurveyResult>;
return !data.enrichedAt;

// AFTER:
const data = loadJsonSync<Partial<SurveyResult>>(`${OUTPUT_DIR}/${topic.id}.json`);
return !data.enrichedAt;
```

---

## Verification Plan

### Automated Tests
```bash
# Run full test suite — must stay green throughout
npm run test -- run

# Run data-pipeline tests specifically
npm run test -- run tests/lib/data-pipeline
```

### Manual Type Check
```bash
npx tsc --noEmit --project tsconfig.json
```

### Smoke-test the concurrency util (no LLM needed)
After creating `utils/concurrency.ts`, the agent can verify it with a quick inline test:
```bash
node --input-type=module <<'EOF'
import { runWithConcurrency } from './scripts/data-generation/utils/concurrency.js';
const tasks = Array.from({ length: 5 }, (_, i) => () => Promise.resolve(i * 2));
const results = await runWithConcurrency(tasks, 3);
console.assert(JSON.stringify(results) === '[0,2,4,6,8]', 'order preserved');
console.log('OK', results);
EOF
```

### Prompt tester (optional, requires LM Studio)
```bash
npx tsx scripts/data-generation/prompt-tester.ts --list
```

---

## File Change Summary

| File | Action | Changes |
|---|---|---|
| `utils/concurrency.ts` | **NEW** | `runWithConcurrency<T>` with onProgress |
| `config.ts` | MODIFY | Add `DEBUG_OUTPUT_DIR`, `QUOTES_PER_CLUSTER`, `DEMOGRAPHIC_NAME` |
| `utils/llm.ts` | MODIFY | Import `DEBUG_OUTPUT_DIR` from config, remove local path computation |
| `utils/fs.ts` | MODIFY | Add `loadJsonSync<T>` |
| `types.ts` | MODIFY | Add `SelectedPersona` interface |
| `lib/prompts/quotes-prompts.ts` | MODIFY | Remove `SelectedPersona` def, import + re-export from types |
| `survey.ts` | MODIFY | Use `runWithConcurrency`; use `DEMOGRAPHIC_NAME` from config |
| `cluster.ts` | MODIFY | Use `DEBUG_OUTPUT_DIR`; use `runWithConcurrency` for Reduce; `id = topicId` |
| `enrichment.ts` | MODIFY | Remove local `runWithConcurrency`; use `QUOTES_PER_CLUSTER` from config; use `loadJsonSync` |
