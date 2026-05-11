---
trigger: model_decision
description: Enforce when editing types, interfaces, or schema documentation
---

# Schema Parity

When modifying any interface in `src/lib/game-logic/types.ts` or `docs/schema.md`:

1. Cross-check the other file immediately
2. If they diverge, update both or flag the mismatch before proceeding
3. Pipeline types (`scripts/data-generation/types.ts`) are Layer A — never merge into Layer B types
