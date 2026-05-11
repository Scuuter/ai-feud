---
name: tech-stack-constraints
description: Framework rules, allowed libraries, and strict anti-patterns for this Next.js + Tailwind + Framer Motion + MongoDB project. Read before writing application code.
disable-model-invocation: true
---

# Tech Stack Constraints

Before writing application code, read the full tech stack specification.

## Required reading

Read `docs/tech-stack.md` — it defines the strict coding guidelines for this project.

## Key constraints to enforce

### App Router Only
- All routing uses Next.js App Router (`/src/app`)
- **NO** legacy `pages/` directory
- **NO** `getServerSideProps` or `getStaticProps`

### Server vs Client Components
- Default to React Server Components (RSC)
- Only add `"use client"` when component requires `useState`, `useEffect`, or event listeners
- Push `"use client"` boundaries as far down the component tree as possible

### Pure TypeScript (Layer B)
- `src/lib/game-logic/` must be 100% pure TypeScript
- **NO** React, Next.js, or DOM imports in game logic files
- Must run in Vitest, Node.js edge functions, and browser seamlessly

### Edge Functions
- API routes use `export const runtime = 'edge'` wherever possible
- All imported libraries must be Edge-compatible (no heavy Node-native deps)

### Allowed Libraries
Next.js (App Router), Tailwind CSS, Framer Motion, MongoDB, PartyKit, fast-levenshtein, Vitest, clsx, tailwind-merge.

**NO** Redux, MUI, Chakra, Ant Design, Prisma, Supabase, or any unapproved packages.

### Database
- MongoDB is a document store — **NO** SQL joins, relational tables, or cross-collection aggregation
- Data is heavily denormalized per `docs/schema.md`
