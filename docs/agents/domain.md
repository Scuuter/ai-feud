# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: Single-context

```
/
├── CONTEXT.md              ← domain glossary (created lazily by /grill-with-docs)
├── docs/
│   ├── adr/                ← architecture decision records (created lazily)
│   ├── glossary.md         ← existing game terminology
│   ├── design-document.md  ← product spec & layer definitions
│   ├── schema.md           ← MongoDB document interfaces
│   └── tech-stack.md       ← framework rules & allowed libraries
└── src/
```

## Before exploring, read these

1. **`docs/glossary.md`** — existing domain terminology for this project
2. **`CONTEXT.md`** at repo root (if it exists) — canonical domain language
3. **`docs/adr/`** — read ADRs that touch the area you're about to work in

If `CONTEXT.md` or `docs/adr/` don't exist yet, **proceed silently**. Don't flag their absence. The `/grill-with-docs` skill creates them lazily when terms or decisions get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/glossary.md` (and `CONTEXT.md` once it exists). Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 — but worth reopening because…_
