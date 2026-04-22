# **Project Roadmap: Survey Says: AI Feud**

## **Phase 1: Minimum Viable Product (Solo Mode)**
*Goal: Prove the core gameplay loop is fun and achieve zero-friction onboarding.*

### **Epic 1. The Engine Room (Data Pipeline - Layer A)**
*Build offline scripts to generate the initial 50 curated topics and their answers using a local LLM.*
- [x] **Configure Environment:** Setup `.env.local` with the local LM Studio server URL.
- [x] **Implement `survey.ts`:** Write a Node.js script in `/scripts/data-generation/` to take a list of `Topic`s and a `Demographic`, pinging the LLM to output 100 unique `Persona` responses.
- [x] **Implement `cluster.ts`:** Write a multi-stage map-reduce script to extract 5-8 core concepts using the topic context, map all responses to clusters or wildcards, and normalize scores to sum to 100.
- [ ] **Implement `enrichment.ts`:** Enrich clustered `SurveyResult` files in three parallel sub-steps: (A) generate 3–5 game-show synonyms for each cluster; (B) generate `QUOTES_PER_CLUSTER` in-character flavor quotes per cluster using personas already assigned to it; (C) generate one flavor quote per wildcard using its `rawAnswer`. Sets `enrichedAt` on the output. Wildcards' `synonyms` array is kept empty for future use.
- [ ] **Implement Prompt Library + `prompt-tester.ts`:** Extract all inline prompt strings from `survey.ts` and `cluster.ts` into `lib/prompts/`. Add `synonyms-prompts.ts` and `quotes-prompts.ts` for enrichment. Implement `prompt-tester.ts` CLI for semi-manual prompt tuning against a live LM Studio instance.
- [ ] **Format Output:** Ensure the final pipeline outputs valid JSON adhering exactly to the `SurveyResult` interface (`topic`, `demographicName`, `clusters`, `wildcards`).
- [ ] **Data Generation:** Run the pipeline to generate **50 MVP questions** for initial testing and gameplay validation.

### **Epic 2. Core Game Logic (Layer B - Pure TypeScript)** ✅
*100% independent of React, Next.js, and the DOM. Use TDD via Vitest.*
- [x] **Setup TDD Environment:** Created failing Vitest files in `/tests/lib/game-logic/` (64 tests, proven failing before implementation).
- [x] **Implement `GameState.ts`:**
  - [x] Define state structures in `src/lib/game-logic/types.ts` based on `schema.md` (`Player`, `Guess`, `Strike`, `Round`, `SurveyResult`, `MatchResult`).
  - [x] Write pure immutable functions: `createRound`, `applyCorrectGuess`, `applyStrike`, `checkWinCondition`, `checkLossCondition`, `isRoundComplete`, `getScore`.
- [x] **Implement `Matcher.ts`:**
  - [x] Step 1: Exact and lowercase string matching against `AnswerCluster.text`, `AnswerCluster.synonyms`, `WildCard.rawAnswer`, and `WildCard.synonyms`.
  - [x] Step 2: Fuzzy matching via `fast-levenshtein` — per-word strategy (default, generous for AI-generated multi-word answers) and whole-string (selectable via `MatcherConfig.fuzzyStrategy`). Configurable threshold (default: 2). Short-word guard for words < 4 chars.
  - [x] WildCard matching supported: `MatchResult.isWildCard` differentiates cluster hits (award points) from wildcard hits (flavor quote only, 0 points).
  - [x] *Note: Semantic LLM validation is explicitly deferred to Phase 2.*

### **Epic 3. The Frontend Core UI (Layer C)**
*Build the Next.js App Router client with Tailwind and Framer Motion. Push `"use client"` as far down the tree as possible.*
- [x] **Design System Foundation:** Authoritative design system (`docs/design-system.md`) defining the Y2K Vice-City aesthetic, token vocabulary (`--color-*`, `--text-*`, `--radius-*`), typography (Space Grotesk / Archivo Black / JetBrains Mono), demographic "channel skin" protocol, and per-component contracts. Implemented in `src/app/globals.css`, `src/lib/design-system/tokens.ts`, and `src/lib/design-system/demographics.ts`.
- [x] **Demographic Skins (Glossary Integration):** Typed registry of four skins (Y2K Vice City base, Game of Thrones, Modern Berlin, Italian Village) with palette, typography, textures, sample topic/answers/wildcard, ticker phrases, and room description. Switching a skin retargets `[data-demographic]` on `<html>` and every themed token cascades.
- [ ] **Game Loop Hook:** Create a custom React hook `useGameLoop` to manage local `GameState` using static JSON data for initial testing.
- [x] **Minimalist Layout:** Main app shell built with Tailwind utilities only (`src/app/layout.tsx`, `src/app/page.tsx`). No component library; typography via `next/font`; background + inks themed via tokens.
- [x] **Component: `<Board />` & `<Tile />`:** Implemented `Tile` with revealed / unrevealed / wildcard states, chunky ink border + hard drop-shadow, rank badge, score, and flavor quote slot. Board rendered as a 2-column grid inside `<TVScreen />`. *Note: Framer-Motion 3D flip to be wired when the hook lands — static reveal state is in place.*
- [x] **Component: `<InputTerminal />`:** Minimalist ink-bordered text input with blinking caret, monospace font, uppercase transform, and focused state. Ready to be wired to `useGameLoop`'s submit handler.
- [x] **Component: `<StrikeIndicator />`:** Full-board overlay supporting `miss` (red X slam) and `wildcard` (accented persona quote card) modes, demo-switchable on the showcase page.
- [x] **Component: `<TVFrame />` / `<TVScreen />`:** Broadcast chassis (CRT bezel, channel label, physical buttons, screen glow) that wraps the gameplay UI so each demographic reads as its own "channel".
- [x] **Component: `<NewsTicker />`:** Broadcast-style bottom ticker fed per-demographic phrases, with reduced-motion fallback.
- [x] **Component: `<DemographicSwitcher />`:** Channel-select radiogroup that drives the active skin and room texture across the whole tree.
- [x] **Composed Preview Page:** `/` renders the full TV mock with live demographic + overlay switching so the visual system can be reviewed and tested end-to-end before gameplay wiring.
- [ ] **Viral Loop:** Implement the "Share your score" button that generates and copies a Wordle-style emoji grid to the user's clipboard.

### **Epic 4. Backend & Database Integration**
- [ ] **Setup MongoDB Atlas:** Initialize the NoSQL document store.
- [ ] **Database Seeding:** Create an admin script to push our 50 locally generated `survey_results` (Layer A) into the MongoDB collection.
- [ ] **API Route - Fetch Data:** Create an Edge function at `/src/app/api/survey/route.ts` to fetch a random `SurveyResult` from MongoDB to initialize the game.

---

## **Phase 2: Multiplayer & Dynamic Generation (V1)**
*Goal: Introduce social play, real-time multiplayer lobbies, and on-the-fly topic generation.*

### **Epic 5. Real-Time Multiplayer Implementation**
*Engine Choice: PartyKit (Cloudflare Edge WebSockets)*
- [ ] **Setup PartyKit:** Initialize the PartyKit server environment (`npx partykit init`).
- [ ] **Lobby System (`Room` Entity):** Implement logic for hosts to create a room and generate a 4-letter join code.
- [ ] **Multiplayer State Sync:** Refactor `GameState.ts` to run on the PartyKit server, handling multiple `Player` entities (display names, session IDs, cumulative scores) syncing across clients.
- [ ] **Gameplay Inputs:** Implement real-time buzzer mechanics or turn-based text inputs synced across all connected clients.

### **Epic 6. Dynamic Generation Orchestration**
- [ ] **Host Configuration:** Build UI for the Host to select a `Demographic` (e.g., "19th Century British Aristocrats") and a `Topic`.
- [ ] **The Pre-Game Show UI:** Design an entertaining, real-time loading screen that updates clients as the backend generates and clusters data.
- [ ] **Dynamic Pipeline Deployment:** Migrate the local `survey.ts` and `cluster.ts` scripts into robust backend Edge functions capable of processing generation and clustering in real-time.
- [ ] **Semantic Validation (Edge LLM):** Integrate a fast, low-cost LLM call (e.g., GPT-4o-mini, Claude Haiku) into `Matcher.ts` as the final fallback validation step if Exact/Fuzzy matching fails.

### **Epic 7. Data Automation & CI/CD**
- [ ] **GitHub Actions Setup:** Create a workflow (`.github/workflows/data-sync.yml`) that triggers on merges to the `main` branch.
- [ ] **Data Validation Step:** Run Vitest over the generated Layer A JSON outputs to ensure they strictly match our `SurveyResult` interface.
- [ ] **MongoDB Seeding Script:** Write a secure script that reads the validated JSON files in `/scripts/data-generation/output` and upserts them into our MongoDB Atlas production cluster using `MONGODB_URI` secrets.
