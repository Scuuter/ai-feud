# Tech Stack & AI Agent Guidelines: Survey Says

This document defines the technology stack and strict coding guidelines for the "Survey Says: AI Feud" project. 

**ATTENTION AI AGENTS:** You must adhere strictly to these rules. Do not hallucinate external libraries, do not use deprecated frameworks, and follow the architectural boundaries defined below.

## 1. Core Architecture
- **Framework:** Next.js (App Router specifically).
- **Language:** TypeScript (Strict mode enabled).
- **Styling:** Tailwind CSS.
- **Animations:** Framer Motion.
- **Database:** MongoDB (Atlas - NoSQL Document Store).
- **Deployment/Compute:** Vercel Edge Functions.
- **Testing:** Vitest.

---

## 2. Frontend Directives (Next.js & React)

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
**App Router Only:**
- All routing must use the Next.js App Router (`/src/app` directory).
- **DO NOT** use the legacy `pages/` directory. 
- **DO NOT** use `getServerSideProps` or `getStaticProps`.

**Server vs. Client Components:**
- Default to React Server Components (RSC) for data fetching and static rendering.
- Only add the `"use client"` directive at the top of a file if the component requires state (`useState`), effects (`useEffect`), or event listeners (like the `<InputTerminal />` or Framer Motion `<Tile />`).
- Push `"use client"` boundaries as far down the component tree as possible.

**Styling Rules:**
- Use Tailwind CSS utility classes exclusively.
- **DO NOT** write custom CSS. Do not create `.css` or `.module.css` files (except for the global root css).
- For dynamic class merging, use `clsx` and `tailwind-merge`.

**Animation Guidelines:**
- Use `framer-motion` for all complex animations (specifically the 3D flip effect on the board tiles).
- Keep animation variants declarative and defined outside the main component body to prevent unnecessary re-renders.

---

## 3. Backend & Logic Directives (Layer B)

**Pure TypeScript Rule:**
- `src/lib/game-logic`
- Core game logic (`GameState.ts` and `Matcher.ts`) must be written in Pure TypeScript.
- **DO NOT** import React, Next.js, or DOM-specific libraries into these files. They must be perfectly isolated so they can run in Vitest, Node.js edge functions, or the browser seamlessly.

**Edge Functions:**
- API routes (`/src/app/api/...`) should be configured to run on the Edge runtime (`export const runtime = 'edge'`) wherever possible for minimal latency.
- Ensure all imported libraries are Edge-compatible (e.g., standard fetch, no heavy Node-native dependencies like `fs` unless in the `/scripts` folder).

---

## 4. Database & Data Pipeline Directives (Layer A)

**MongoDB NoSQL Paradigm:**
- Treat MongoDB purely as a document store. 
- **DO NOT** attempt to write SQL joins, relational tables, or complex aggregation pipelines across multiple collections.
- Data must be heavily denormalized. The JSON schema for a Topic must contain its concepts and synonyms nested within the same document.
- Follow the schema defined in `schema.md` perfectly.

**Offline Scripts (`/scripts/data-generation`):**
- Scripts in this folder are executed locally via Node.js and Warp terminal. 
- They are allowed to use standard Node APIs (`fs`, `path`) to write JSON files locally.
- Point all LLM fetch requests in these scripts to the local LM Studio server (address in `.env.local`).

---

## 5. Technology Choices & Allowed Libraries

* **Frontend:** **React + Next.js (App Router)** * *Why:* Industry standard, massive ecosystem, easy deployment. Using React ensures that state management and business logic can be lifted and shifted to React Native later.  
* **Backend:** **Node.js (TypeScript) + Serverless Edge Functions** * *Why:* Keeps the stack unified. Edge functions allow for low-latency validation close to the user.  
* **Database:** **MongoDB (NoSQL)** * *Why:* The game data is naturally document-oriented. AI-generated responses can be stored as nested JSON objects (Question -> Clustered Answers -> Synonyms).  
* **Styling & Animation:** **Tailwind CSS + Framer Motion** * *Why:* Tailwind allows rapid UI design. Framer Motion handles the "card flip" animations crucial for the feel.  
* **Real-time Engine (V1):** **PartyKit** * *Why:* Serverless WebSockets on Cloudflare's edge. Extremely fast setup for JS apps without needing a relational DB.
* **AI Engine:** **Local LLM (Phase 1) / Cheapest model for answer validation (Phase 2)** * *Why:* Cost-effective and fast. Keeping MVP entirely local saves API costs and reduces setup friction.
* **Fuzzy Matching:** **fast-levenshtein** * *Why:* Zero-dependency string matching package for typo tolerance, highly compatible with Pure TypeScript and Edge runtimes.

**Allowed Libraries:** Next.js (App Router), Tailwind CSS, Framer Motion, MongoDB, PartyKit, fast-levenshtein, Vitest.

---

## 6. Strict Anti-Patterns (DO NOT DO THESE)
1. **NO `any` types:** TypeScript must be strictly typed. If you don't know the type, define an interface or use `unknown` and narrow it.
2. **NO Redux or Context Overload:** For Phase 1, use simple local state (`useState` / custom hooks) or standard URL search parameters. Do not over-engineer global state management.
3. **NO UI Frameworks:** Do not import Material UI, Chakra, or Ant Design. We are building a custom, minimalist UI with Tailwind.
4. **NO Premature Database Writes:** The MVP game loop runs entirely on read-only JSON data. Do not write user scores or guesses to the database in Phase 1.
