# **Project Roadmap: Survey Says: AI Feud**

## **Phase 1: Minimum Viable Product (Solo Mode)**
*Goal: Prove the core gameplay loop is fun and achieve zero-friction onboarding.*

### **Epic 1. The Engine Room (Data Pipeline - Layer A)**
*Build offline scripts to generate the initial 50 curated topics and their answers using a local LLM.*
- [ ] **Configure Environment:** Setup `.env.local` with the local LM Studio server URL.
- [ ] **Implement `survey.ts`:** Write a Node.js script in `/scripts/data-generation/` to take a list of `Topic`s and a `Demographic`, pinging the LLM to output 100 unique `Persona` responses.
- [ ] **Implement `cluster.ts`:** Write a script to group the 100 raw strings into 5-8 `AnswerCluster`s (with scores and `Synonym` arrays).
- [ ] **Format Output:** Ensure `cluster.ts` outputs valid JSON adhering exactly to the `SurveyResultDocument` interface (`topic`, `demographicName`, `clusters`, `flavorQuotes`).
- [ ] **Data Generation:** Run the pipeline to generate **50 MVP questions** for initial testing and gameplay validation.

### **Epic 2. Core Game Logic (Layer B - Pure TypeScript)**
*100% independent of React, Next.js, and the DOM. Use TDD via Vitest.*
- [ ] **Setup TDD Environment:** Create initial failing Vitest files in `/tests/lib/game-logic/`.
- [ ] **Implement `GameState.ts`:**
  - [ ] Define state structures based on `schema.md` (`Player`, `Guess`, `Strike`, `Round`).
  - [ ] Write logic to manage round state, track accumulated points, handle the 3-strike penalty, and determine win/loss conditions.
- [ ] **Implement `Matcher.ts`:**
  - [ ] Step 1: Exact and lowercase string matching against the `AnswerCluster` text and `Synonym` arrays.
  - [ ] Step 2: Implement fuzzy matching utilizing the `fast-levenshtein` npm package for robust typo tolerance.
  - [ ] *Note: Semantic LLM validation is explicitly deferred to Phase 2.*

### **Epic 3. The Frontend Core UI (Layer C)**
*Build the Next.js App Router client with Tailwind and Framer Motion. Push `"use client"` as far down the tree as possible.*
- [ ] **Game Loop Hook:** Create a custom React hook `useGameLoop` to manage local `GameState` using static JSON data for initial testing.
- [ ] **Minimalist Layout:** Build the main application UI using purely Tailwind utility classes.
- [ ] **Component: `<Board />` & `<Tile />`:** Implement the visual grid using `framer-motion` to handle the 3D card flip effects when a guess is correct.
- [ ] **Component: `<InputTerminal />`:** Build a minimalist text input that captures a user's guess and clears upon pressing "Enter".
- [ ] **Component: `<StrikeIndicator />`:** Create a large visual overlay/feedback mechanism to show when an incorrect guess yields a `Strike`.
- [ ] **Viral Loop:** Implement the "Share your score" button that generates and copies a Wordle-style emoji grid to the user's clipboard.

### **Epic 4. Backend & Database Integration**
- [ ] **Setup MongoDB Atlas:** Initialize the NoSQL document store.
- [ ] **Database Seeding:** Create an admin script to push our 50 locally generated `survey_results` (Layer A) into the MongoDB collection.
- [ ] **API Route - Fetch Data:** Create an Edge function at `/src/app/api/survey/route.ts` to fetch a random `SurveyResultDocument` from MongoDB to initialize the game.

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
- [ ] **Data Validation Step:** Run Vitest over the generated Layer A JSON outputs to ensure they strictly match our `SurveyResultDocument` interface.
- [ ] **MongoDB Seeding Script:** Write a secure script that reads the validated JSON files in `/scripts/data-generation/output` and upserts them into our MongoDB Atlas production cluster using `MONGODB_URI` secrets.
