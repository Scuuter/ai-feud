# Commands

Standard commands for interacting with this project. Skills that need to run tests, lint, or start the dev server should use these exact commands.

## Test Suites

| Suite | Command |
|---|---|
| **All tests** | `npm run test -- run` |
| **Game Logic (Layer B)** | `npm run test -- run src/lib/game-logic` |
| **Data Pipeline (Layer A)** | `npm run test -- run tests/lib/data-pipeline` |

## Linting

```bash
npm run lint
```

## Dev Server

```bash
npm run dev
```

## Data Generation Pipeline

> **⚠️ DO NOT run autonomously.** These commands are for manual user execution only. They call a local LM Studio instance and generate/overwrite data files.

| Step | Command |
|---|---|
| **Generate MVP Data** | `npx tsx scripts/data-generation/survey.ts && npx tsx scripts/data-generation/cluster.ts` |
| **Enrich Data** | `npx tsx scripts/data-generation/enrichment.ts` |

## Task Files

Planning tasks are written to `docs/tasks/[feature].md`.
