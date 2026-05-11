---
name: prompt-engineer
description: Optimize AI-Feud prompt builder functions. Use when editing prompts in scripts/data-generation/lib/prompts/ or when you need to improve prompt quality or test prompts.
---

# Prompt Engineer

## Goal

Improve data pipeline prompt quality. Only touch builder function bodies. No touch orchestration logic. No touch JSON schemas.

## Workflows

### 1. Find Prompt

Prompts in `scripts/data-generation/lib/prompts/`. File mapping:

- `survey-prompts.ts` -> `buildSurveyPrompt`
- `cluster-prompts.ts` -> `buildExtractCategoriesPrompt`, `buildAssignChunkPrompt`
- `synonyms-prompts.ts` -> `buildSynonymPrompt`
- `quotes-prompts.ts` -> `buildClusterQuotePrompt`, `buildWildcardQuotePrompt`
- `prompt-registry.ts` -> `PROMPT_REGISTRY`

### 2. Modify & Test

1. Edit **only** builder function body.
2. Verify LM Studio running locally.
3. Test interactively:
   - List prompts: `npx tsx scripts/data-generation/prompt-tester.ts --list`
   - Run prompt (default fixture): `npx tsx scripts/data-generation/prompt-tester.ts --prompt <key>`
   - Run prompt (custom fixture): `npx tsx scripts/data-generation/prompt-tester.ts --prompt <key> --fixture '{"field":"value"}'`

### 3. Validate Shape

Run pipeline tests. Confirm no breaks.

```bash
npm run test -- run tests/lib/data-pipeline/prompts.test.ts
```

## Boundary Rules

- **Only** edit builder function body.
- **Do not** touch schemas or orchestrators (`survey.ts`, `cluster.ts`, `enrichment.ts`).
- Layer A code. `fs`, `path`, local LLM endpoints OK.

## References

- See [data_quality_criteria.md](../../../docs/tasks/data_quality_criteria.md) for prompt goals, rules, and Gold Standard JSON examples.
- See [lm-studio-setup.md](../../../docs/lm-studio-setup.md) for current models information.
