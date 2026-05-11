---
name: schema-reference
description: MongoDB document interfaces and runtime state entities for the game. Read before editing types, data structures, API responses, or database queries.
disable-model-invocation: true
---

# Schema Reference

Before editing types, data structures, or anything touching game data, read the schema specification.

## Required reading

Read `docs/schema.md` — it is the single source of truth for database schema and runtime state interfaces.

## Key entities

### Database (MongoDB)

| Collection | Interface | Purpose |
|---|---|---|
| `survey_results` | `SurveyResult` | Primary document fetched by game client. Contains topic, clusters, wildcards. |
| `pipeline_raw_data` | `RawPipelineDocument` | Offline admin only. Raw LLM responses. **Never fetched by Next.js client.** |

### Runtime State

| Interface | Purpose |
|---|---|
| `Player` | Session/multiplayer ID + score tracker |
| `Guess` | Raw input + timestamp |
| `Strike` | Failed guess + strike number (1-3) |
| `Round` | Active survey + revealed clusters + strikes + completion flag |

## Constraints

- **Denormalized** — all data nested in single documents. No joins.
- **Schema parity** — `docs/schema.md` and `src/lib/game-logic/types.ts` must always match (see `schema-parity` rule)
- **Never invent dummy data** — use exact interfaces from the schema
- Pipeline types (`scripts/data-generation/`) are Layer A — never merge into Layer B types
