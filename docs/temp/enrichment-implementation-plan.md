# Enrichment Pipeline + Prompt Management System

## Part 1: Resolved Design Decisions

| Question | Decision |
|---|---|
| `--missing` detection | Add `enrichedAt?: string` (ISO timestamp) to `SurveyResult`. Absence = not enriched. |
| Wildcard `rawAnswer` | Add `rawAnswer: string` to `WildCard`. Populated by `cluster.ts` in memory during wildcard construction. `synonyms` stays `[]` for future use. |
| Quote prompt seeding | **Always include** the persona's `rawAnswer` in the prompt to anchor the generated quote. |
| Wildcard call volume | Uncapped. All wildcards get a quote. |

---

## Part 2: Schema Changes

### [MODIFY] `types.ts` + `schema.md`

Add `enrichedAt` to `SurveyResult` and `rawAnswer` to `WildCard`:

```typescript
export interface SurveyResult {
  id: string;
  topicText: string;
  demographicName: string;
  clusters: AnswerCluster[];
  wildcards: WildCard[];
  tags?: string[];
  /** ISO 8601 timestamp set by enrichment.ts. Absence means not yet enriched. */
  enrichedAt?: string;
}

export interface WildCard {
  personaId: string;
  /** The persona's original raw survey answer; populated by cluster.ts */
  rawAnswer: string;
  synonyms: string[];      // reserved for future use, kept empty
  flavorQuote: FlavorQuote;
}
```

`enrichment.ts` sets `enrichedAt` on save. `--missing` filter: topics where latest clustered file has no `enrichedAt`.

---

## Part 3: Enrichment Pipeline Architecture

### Data Flow

```
output/raw/<topicId>.json       ← persona lookup (personaName, toneOfVoice)
output/<topicId>.json           ← input SurveyResult produced by cluster.ts
                                   wildcards already carry rawAnswer field
        │
        ▼
[Sub-step A] Cluster Synonym Generation  → parallel fan-out, clusters only
[Sub-step B] Cluster Quote Generation    → parallel fan-out, QUOTES_PER_CLUSTER per cluster
[Sub-step C] Wildcard Quote Generation   → parallel fan-out, 1 quote per wildcard
[Sub-step D] Assembly                    → pure merge, sets enrichedAt
        │
        ▼
output/<topicId>-N.json         ← new versioned file (getNextVersionPath)
```

All LLM fan-out via `Promise.all` pooled at `CONCURRENCY_LIMIT = 8`.

---

## Part 4: Sub-step Contracts

### Sub-step A — Cluster Synonym Generation

**Input:**
```typescript
interface SynonymJobInput {
  clusterText: string;   // e.g. "Life or Death!"
  topicText: string;
}
```

**Output (LLM JSON schema):**
```typescript
interface SynonymJobOutput {
  synonyms: string[];    // 3-5 game-show phrasing variations
}
```

**Pure functions (→ `lib/prompts/synonyms-prompts.ts`):**
- `buildSynonymPrompt(input: SynonymJobInput): string`
- `synonymJobSchema` — LM Studio JSON schema object

**Pure functions (→ `lib/enrichment.ts`):**
- `validateSynonyms(raw: unknown): string[]` — filter empty strings, dedup, cap at 5

---

### Sub-step B — Cluster Quote Generation

**Selection (pure, `lib/enrichment.ts`):**
```typescript
function selectPersonasForCluster(
  cluster: AnswerCluster,
  rawData: RawSurveyData,
  count: number           // QUOTES_PER_CLUSTER
): SelectedPersona[]
// Returns count random entries from cluster.personaIds, enriched with personaName + toneOfVoice + rawAnswer
// Edge cases: if personaIds.length < count, return all available without error
```

**Input (per cluster):**
```typescript
interface ClusterQuoteJobInput {
  clusterText: string;
  topicText: string;
  selectedPersonas: SelectedPersona[];
}

interface SelectedPersona {
  personaId: string;
  personaName: string;
  toneOfVoice: string;
  rawAnswer: string;   // the original text from RawSurveyData
}
```

**Output (LLM JSON schema):**
```typescript
interface ClusterQuoteJobOutput {
  quotes: Array<{ personaId: string; personaName: string; text: string }>;
}
```

**Pure functions (→ `lib/prompts/quotes-prompts.ts`):**
- `buildClusterQuotePrompt(input: ClusterQuoteJobInput): string`
- `clusterQuoteJobSchema` — LM Studio JSON schema object

**Pure functions (→ `lib/enrichment.ts`):**
- `validateClusterQuotes(raw: unknown, expectedPersonaIds: string[]): FlavorQuote[]`

---

### Sub-step C — Wildcard Quote Generation

**Selection (pure, `lib/enrichment.ts`):**
```typescript
function selectPersonaForWildcard(
  wildcard: WildCard,
  rawData: RawSurveyData
): SelectedPersona
// Single lookup by personaId. If not found, returns { personaId, personaName: personaId, toneOfVoice: '', rawAnswer: '' } as fallback
```

**Input (per wildcard):**
```typescript
interface WildcardQuoteJobInput {
  personaId: string;
  personaName: string;
  toneOfVoice: string;
  rawAnswer: string;
  topicText: string;
}
```

**Output (LLM JSON schema):**
```typescript
interface WildcardQuoteJobOutput {
  flavorQuote: { personaName: string; text: string };
}
```

**Pure functions (→ `lib/prompts/quotes-prompts.ts`):**
- `buildWildcardQuotePrompt(input: WildcardQuoteJobInput): string`
- `wildcardQuoteJobSchema` — LM Studio JSON schema object

**Pure functions (→ `lib/enrichment.ts`):**
- `validateWildcardQuote(raw: unknown): FlavorQuote`

---

### Sub-step D — Assembly (pure)

```typescript
// Merges enriched clusters + wildcards into final SurveyResult, sets enrichedAt
function assembleFinalResult(
  original: SurveyResult,
  enrichedClusters: AnswerCluster[],
  enrichedWildcards: WildCard[]
): SurveyResult  // always sets enrichedAt: new Date().toISOString()
```

---

## Part 5: Prompt Management System

### Problem

All three scripts (`survey.ts`, `cluster.ts`, `enrichment.ts`) embed prompt strings inline. As prompts grow more complex, there is no way to:
- Test a prompt in isolation without running the entire script
- Iterate on wording without touching orchestration logic
- See all prompts in one place

### Solution: Prompt Library + `prompt-tester.ts` CLI

```
scripts/data-generation/
  lib/
    prompts/
      survey-prompts.ts   ← extracted from survey.ts
      cluster-prompts.ts  ← extracted from cluster.ts
      synonyms-prompts.ts ← new; reusable synonym generation
      quotes-prompts.ts   ← new; reusable cluster + wildcard quote generation
      index.ts            ← re-exports all prompts + PROMPT_REGISTRY
  prompt-tester.ts        ← new standalone CLI
```

### Prompt Module Contract

Each prompt module exports **pure builder functions** and a **companion JSON schema** (already used by `callLMStudioWithRetry`). No imports from `config.ts`, no I/O.

```typescript
// Example: lib/prompts/cluster-prompts.ts

export interface ExtractCategoriesInput {
  topicText: string;
  answers: string[];
  answerCount: number;
}

/** Pure: builds the prompt string. No side effects. */
export function buildExtractCategoriesPrompt(input: ExtractCategoriesInput): string { ... }

/** JSON schema passed to LM Studio for structured output */
export const extractCategoriesSchema = { ... } // moved from cluster.ts
```

### Prompt Registry (`lib/prompts/index.ts`)

A typed registry maps string keys to prompt descriptors. `prompt-tester.ts` uses this to discover available prompts:

```typescript
export interface PromptDescriptor {
  name: string;
  description: string;
  /** Fixture data used for manual testing via prompt-tester.ts */
  defaultFixture: Record<string, unknown>;
  build: (input: Record<string, unknown>) => string;
  schema?: Record<string, unknown>;
  /** Suggested model and params for this prompt */
  suggestedModel: 'small' | 'large';
  suggestedMaxTokens: number;
  suggestedTemperature: number;
}

export const PROMPT_REGISTRY: Record<string, PromptDescriptor> = {
  'survey:persona-answer':       { ... },
  'cluster:extract-categories':  { ... },
  'cluster:assign-chunk':        { ... },
  'enrichment:cluster-synonyms': { ... },  // → synonyms-prompts.ts
  'enrichment:cluster-quote':    { ... },  // → quotes-prompts.ts
  'enrichment:wildcard-quote':   { ... },  // → quotes-prompts.ts
};
```

### `prompt-tester.ts` — The Semi-Manual Tuning CLI

```
npx tsx scripts/data-generation/prompt-tester.ts --prompt enrichment:cluster-quote
npx tsx scripts/data-generation/prompt-tester.ts --prompt cluster:extract-categories --fixture '{"topicText":"..."}'
npx tsx scripts/data-generation/prompt-tester.ts --list
```

**Workflow:**
1. `--list` prints all registered prompt keys + descriptions
2. `--prompt <key>` builds the prompt from `defaultFixture` (or `--fixture` JSON override), prints the resolved prompt, runs it against LM Studio, and streams output live to the terminal
3. Output is printed raw + parsed JSON (if schema is set)
4. No file I/O — purely interactive inspection

**Implementation:**
- Parses `--prompt`, `--fixture`, `--list` from argv
- Uses `callLMStudio` directly (single call, no retry) so the developer sees raw failure
- Prints `=== PROMPT ===` block then streams SSE tokens live via the existing SSE parser
- Prints `=== PARSED OUTPUT ===` at the end

This makes iteration tight: edit prompt builder → re-run tester → inspect output.

### Refactoring existing scripts

| Script | Change |
|---|---|
| `survey.ts` | Import `buildSurveyPrompt` from `lib/prompts/survey-prompts.ts`; remove inline template string |
| `cluster.ts` | Import `buildExtractCategoriesPrompt`, `buildAssignChunkPrompt`, `extractCategoriesSchema`, `assignClustersChunkSchema` from `lib/prompts/cluster-prompts.ts`; remove inline definitions |
| `enrichment.ts` | Import synonym builders from `lib/prompts/synonyms-prompts.ts`; import quote builders from `lib/prompts/quotes-prompts.ts` |

The orchestration logic in each script does not change — only the prompt string and schema source changes.

---

## Part 6: File Map

### New Files

| File | Type | Description |
|---|---|---|
| `scripts/data-generation/enrichment.ts` | Script | Main enrichment orchestrator |
| `scripts/data-generation/lib/enrichment.ts` | Pure lib | Selection, validation, assembly functions |
| `scripts/data-generation/lib/prompts/survey-prompts.ts` | Pure lib | Extracted survey prompt builder |
| `scripts/data-generation/lib/prompts/cluster-prompts.ts` | Pure lib | Extracted cluster prompt builders + schemas |
| `scripts/data-generation/lib/prompts/synonyms-prompts.ts` | Pure lib | Synonym prompt builder + schema |
| `scripts/data-generation/lib/prompts/quotes-prompts.ts` | Pure lib | Cluster + wildcard quote prompt builders + schemas |
| `scripts/data-generation/lib/prompts/index.ts` | Registry | `PROMPT_REGISTRY` + re-exports |
| `scripts/data-generation/prompt-tester.ts` | Script | Interactive prompt tuning CLI |
| `tests/lib/data-pipeline/enrichment.test.ts` | Test | TDD for all pure enrichment functions |
| `tests/lib/data-pipeline/prompts.test.ts` | Test | Snapshot/shape tests for all prompt builders |

### Modified Files

| File | Change |
|---|---|
| `scripts/data-generation/types.ts` | Add `enrichedAt?: string` to `SurveyResult`; add `rawAnswer: string` to `WildCard` |
| `docs/schema.md` | Document `enrichedAt` and `rawAnswer` fields |
| `scripts/data-generation/survey.ts` | Import prompt from `lib/prompts/survey-prompts.ts` |
| `scripts/data-generation/cluster.ts` | Import prompts + schemas from `lib/prompts/cluster-prompts.ts`; populate `wildcard.rawAnswer` from `rawData.rawResponses` during wildcard construction |

---

## Part 7: TDD Boundaries

### High priority (pure, non-trivial logic)

| Test | What it proves |
|---|---|
| `selectPersonasForCluster` — count < available | Returns exactly `count` items |
| `selectPersonasForCluster` — count > available | Returns all available without throwing |
| `selectPersonasForCluster` — personaId not in rawData | Excluded gracefully |
| `selectPersonaForWildcard` — happy path | Returns correct `personaName` + `toneOfVoice` |
| `selectPersonaForWildcard` — personaId missing from raw | Returns fallback object |
| `validateSynonyms` — non-array input | Throws or returns [] |
| `validateSynonyms` — duplicates + empty strings | Deduped, filtered |
| `validateSynonyms` — length > 5 | Capped at 5 |
| `validateClusterQuotes` — missing personaIds | Throws |
| `validateWildcardQuote` — missing text field | Throws |
| `assembleFinalResult` | `enrichedAt` is set, `id` is preserved, cluster order is preserved |

### Medium priority (prompt builders — shape tests)

| Test | What it proves |
|---|---|
| `buildSynonymPrompt` | Output contains clusterText and topicText |
| `buildClusterQuotePrompt` | Output contains each persona's name + rawAnswer |
| `buildWildcardQuotePrompt` | Output contains personaName + rawAnswer + topicText |
| All prompt builders | Output is a non-empty string, no `undefined` interpolations |

---

## Part 8: Documentation Changes

The coding agent **must update all three docs** before or alongside implementation. They contain descriptions that contradict the decisions in this plan.

### [MODIFY] `docs/schema.md`

In the `WildCard` interface block, add the `rawAnswer` field:
```typescript
export interface WildCard {
  personaId: string;
  /** The persona's original raw survey answer, populated by cluster.ts */
  rawAnswer: string;
  synonyms: string[];     // reserved for future enrichment; kept empty for now
  flavorQuote: FlavorQuote;
}
```

In the `SurveyResult` interface block, add `enrichedAt`:
```typescript
  /** ISO 8601 timestamp set by enrichment.ts. Absence means the topic has not been enriched yet. */
  enrichedAt?: string;
```

### [MODIFY] `docs/tasks/layer-A-PRD.md`

In **Step 3: Enrichment**, replace the current description with:

- **Synonym Generation (clusters only):** For each `AnswerCluster`, call the LLM to generate 3–5 game-show synonyms. Wildcards do **not** get LLM-generated synonyms; their `synonyms` array is reserved for future use.
- **Cluster Quote Generation:** For each cluster, pick `QUOTES_PER_CLUSTER` random persona IDs from `cluster.personaIds`, look them up in the raw survey file to get `personaName`, `toneOfVoice`, and `rawAnswer`. Pass all three to the LLM to generate an in-character `FlavorQuote`.
- **Wildcard Quote Generation:** For each wildcard, use `wildcard.personaId` to look up the persona in the raw survey file. Pass `personaName`, `toneOfVoice`, and `rawAnswer` to the LLM to generate a `FlavorQuote`. All wildcards are processed; the call is not capped.
- **Assembly:** Merge enriched clusters and wildcards into the final `SurveyResult`, set `enrichedAt: new Date().toISOString()`, and save via `getNextVersionPath`.

Also add a note under **Step 3** about the wildcard `rawAnswer` field:
> `WildCard.rawAnswer` is populated by `cluster.ts` in memory (from `RawSurveyData.rawResponses`) at the time wildcards are constructed, not by `enrichment.ts`.

Also add a note about the **Prompt Library**:
> All prompt builder functions and their LM Studio JSON schemas live in `lib/prompts/`. The scripts import from there; no prompt strings are defined inline. Use `prompt-tester.ts` to test individual prompts against a live LM Studio instance before running a full pipeline script.

### [MODIFY] `docs/roadmap-checklist.md`

Replace the enrichment checklist item:
```
- [ ] **Implement `enrichment.ts`:** Write an additional script to pass generated clusters through a fast LLM to generate 3-5 valid game-show synonyms per answer, and generate a flavor quote for each cluster and wildcard by picking a unique persona.
```
With:
```
- [ ] **Implement `enrichment.ts`:** Enrich clustered `SurveyResult` files in three parallel sub-steps: (A) generate 3–5 game-show synonyms for each cluster; (B) generate `QUOTES_PER_CLUSTER` in-character flavor quotes per cluster using personas already assigned to it; (C) generate one flavor quote per wildcard using its `rawAnswer`. Sets `enrichedAt` on the output. Wildcards' `synonyms` array is kept empty for future use.
```

Also add a new checklist item below `enrichment.ts` for the prompt library:
```
- [ ] **Implement Prompt Library + `prompt-tester.ts`:** Extract all inline prompt strings from `survey.ts` and `cluster.ts` into `lib/prompts/`. Add `synonyms-prompts.ts` and `quotes-prompts.ts` for enrichment. Implement `prompt-tester.ts` CLI for semi-manual prompt tuning against a live LM Studio instance.
```

---

## Part 9: Verification Plan

### Step 1 — TDD (Mode B)
```bash
npm run test -- run tests/lib/data-pipeline/enrichment.test.ts
npm run test -- run tests/lib/data-pipeline/prompts.test.ts
# Prove all tests fail before implementation
```

### Step 2 — Implementation (Mode C)
```bash
npm run test -- run   # all tests should be green after implementation
npm run lint
```

### Step 3 — Prompt tester (semi-manual, run by developer)
After implementation, the developer validates prompts interactively using:
```bash
npx tsx scripts/data-generation/prompt-tester.ts --list
npx tsx scripts/data-generation/prompt-tester.ts --prompt enrichment:cluster-synonyms
npx tsx scripts/data-generation/prompt-tester.ts --prompt enrichment:cluster-quote \
  --fixture '{...}'
```
The coding agent must not invoke these commands. They require a running LM Studio instance.
