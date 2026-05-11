---
trigger: model_decision
description: Enforce when preparing commits
---

# Commit Format

One commit - one change (feature, fix, dicumentation update)

Prefix commits with the layer tag:

- `[data]` — data pipeline (`scripts/data-generation/`)
- `[logic]` — game logic (`src/lib/game-logic/`, `src/app/api/`)
- `[ui]` — frontend UI (`src/app/`, `src/components/`)
- `[prompts]` — prompts (`scripts/data-generation/lib/prompts/`)
- `[docs]` — documentation only

Format: `[layer] verb: short description`

Examples:

- `[logic] feat: add per-word fuzzy matching to Matcher`
- `[ui] fix: restore focus after wildcard overlay dismissal`
- `[docs] chore: extract Mode D context to skill`
