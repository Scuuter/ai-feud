# Mode D: Prompt Engineer — Skill Context

All context extracted from AGENTS.md and tech-stack.md needed to build a repo-local skill.

## Goal

Improve data pipeline prompt quality without touching orchestration logic.

## Workflow (from AGENTS.md §4 Mode D)

1. Read `docs/tech-stack.md` §4 (Offline Scripts / Prompt Library) to understand the architecture.
2. Identify the target prompt in `scripts/data-generation/lib/prompts/`. Each prompt stage has its own file; schemas live alongside builders in the same module.
3. Edit **only** the builder function body in the relevant `*-prompts.ts` file. Do not touch schemas or orchestrators.
4. Validate the change interactively using `prompt-tester.ts` (see commands below).
5. Run `npm run test -- run tests/lib/data-pipeline/prompts.test.ts` to confirm shape tests still pass.

## Prompt Library Architecture (from tech-stack.md §4)

Location: `/scripts/data-generation/lib/prompts/`

All prompt builder functions and their LM Studio JSON schemas are defined here as **pure functions** — no I/O, no config imports.

Each pipeline stage has its own module. Orchestrator scripts (`survey.ts`, `cluster.ts`, `enrichment.ts`) import from here; no prompt strings are defined inline.

`prompt-registry.ts` owns the typed `PROMPT_REGISTRY` and re-exports all modules as a single import surface.

### File Ownership Table

| File | Owns |
|---|---|
| `survey-prompts.ts` | `buildSurveyPrompt` |
| `cluster-prompts.ts` | `buildExtractCategoriesPrompt`, `buildAssignChunkPrompt` + schemas |
| `synonyms-prompts.ts` | `buildSynonymPrompt` + schema |
| `quotes-prompts.ts` | `buildClusterQuotePrompt`, `buildWildcardQuotePrompt` + schemas |
| `prompt-registry.ts` | `PROMPT_REGISTRY`, `PromptDescriptor` + re-exports all of the above |

### Actual files on disk (confirmed)

```
scripts/data-generation/lib/prompts/
├── cluster-prompts.ts
├── prompt-registry.ts
├── quotes-prompts.ts
├── survey-prompts.ts
└── synonyms-prompts.ts
```

## Prompt Optimisation Rules (from tech-stack.md §4)

- Edit **only** the builder function body in the relevant file
- Use `prompt-tester.ts` to test against a live LM Studio instance
- Run `npm run test -- run tests/lib/data-pipeline/prompts.test.ts` to confirm shape tests pass
- Do **not** modify schemas or orchestrators as part of a prompt-quality change

## Commands (from AGENTS.md §6)

### Prompt Tester (requires LM Studio running locally)

```bash
# List all registered prompts with descriptions and model hints
npx tsx scripts/data-generation/prompt-tester.ts --list

# Run a prompt with its default fixture and print the LLM response
npx tsx scripts/data-generation/prompt-tester.ts --prompt <key>

# Override the fixture with custom JSON for targeted edge-case testing
npx tsx scripts/data-generation/prompt-tester.ts --prompt <key> --fixture '{"field":"value"}'
```

### Validation

```bash
npm run test -- run tests/lib/data-pipeline/prompts.test.ts
```

## Boundary Rules

- Scripts in `/scripts/data-generation/` are Layer A — allowed to use `fs`, `path`, local LLM endpoints
- Point all LLM fetch requests to local LM Studio server (address in `.env.local`)
- Orchestrator scripts (`survey.ts`, `cluster.ts`, `enrichment.ts`) are NOT in scope for prompt quality changes

## Notes for Skill Creation

- This should be a **repo-local skill** (lives in project, not global)
- Consider placing under `.agents/skills/prompt-engineer/` or similar project-local convention
- The skill should be invocable when user wants to iterate on prompt quality
- Key constraint: prompt-tester requires LM Studio running locally — skill should check/warn
