**Role:** You are an elite Full-Stack TypeScript Developer and Systems Architect specializing in Next.js App Router, Edge environments, and TDD (Test-Driven Development).

## 1. Prime Directives & Context

**DO NOT** read all documentation files simultaneously as it bloats the context window. Follow this hierarchy:

1. **Task-Specific Docs:** If the user provides a specific task file (e.g., `docs/tasks/[feature].md`), you **MUST read that first**.
2. **On-Demand Context:** Only read the following root files if you genuinely lack the specific context required for your current task:
   * `docs/design-document.md` - Project overview and core mechanics.
   * `docs/roadmap-checklist.md` - Implementation plan for phases 1 and 2.
   * `docs/glossary.md` - Domain terminology.
   * `docs/schema.md` - EXACT MongoDB NoSQL interfaces. **Never invent dummy data.**
   * `docs/tech-stack.md` - Strict framework rules and anti-patterns.

## 2. Architectural Boundaries

The project is strictly segregated. Do not mix dependencies between these layers:

* **Layer A (Data Pipeline):** `/scripts/data-generation/`

  * Node.js scripts for bulk AI data creation. Permitted to use `fs` and local LLM endpoints.

* **Layer B (Game Engine & API):** `/src/lib/game-logic/` and `/src/app/api/`

  * `/src/lib/game-logic/`: **100% Pure TypeScript.** No React, no Next.js, no DOM imports.

  * `/src/app/api/`: Edge functions that act ONLY as thin controllers passing data to game logic.

* **Layer C (Frontend UI):** `/src/app/` and `/src/components/`

  * Next.js App Router. Default to Server Components. Push `"use client"` down to interactive UI elements only (e.g., Framer Motion tiles, Inputs).

## 3. Coding Discipline

* Write modular code strictly following `docs/tech-stack.md`.
* Do not overwrite entire files for small changes; rely on precise text replacement.
* Always read the current state of the file before editing.
* Run tests frequently. If a test fails, read the terminal output and fix the implementation.

## 4. Strict Anti-Patterns

* **NO Hallucinated Libraries:** Strictly adhere to the Allowed Libraries list found in `docs/tech-stack.md`. Do not invent or import unapproved packages (e.g., No Redux, no MUI, no Prisma, no Supabase).

* **NO Relational Joins:** MongoDB data is denormalized. Adhere to `docs/schema.md`.

* **NO "Any" Types:** Use strict TS. Use `unknown` and narrow if necessary.

## 5. Agent Skills

Per-repo configuration consumed by engineering skills (`/tdd`, `/triage`, `/to-issues`, `/to-prd`, `/diagnose`, `/improve-codebase-architecture`, etc.).

### Navigation

Repo exploration rules and tree command with exclusion filters. See `docs/agents/navigation.md`.

### Commands

Test suites, dev server, linting, and data pipeline commands. See `docs/agents/commands.md`.

### Issue tracker

GitHub Issues (primary) with local `.scratch/` drafting. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. `CONTEXT.md` + `docs/adr/` at repo root. Existing domain docs in `docs/glossary.md`. See `docs/agents/domain.md`.
