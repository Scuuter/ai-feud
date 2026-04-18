# Product Requirements Document: Layer A (Data Pipeline)

## 1. Executive Summary

This pipeline (`scripts/data-generation/`) orchestrates the offline generation of MVP content for "Survey Says: AI Feud". It takes a list of `Topics` and `Personas` and uses local LLMs to generate 100 isolated AI responses. It then semantically clusters those responses into `AnswerCluster`s (for the main game board) and `WildCard`s (for exact-match easter eggs), performing strict mathematical normalization so the main board always totals exactly 100 points. 

Currently, the orchestration is separated strictly into two discrete CLI scripts: `survey.ts` and `cluster.ts`.

## 2. Pipeline Configuration Constants

The following parameters dictate the execution flow and limits of the pipeline. These should be defined as constants in the code to allow easy refinement during testing:

* **`CONCURRENCY_LIMIT = 5`**: The maximum number of simultaneous requests sent to the local LM Studio server. (Prevents overloading an M1 Mac with 32GB RAM).
* **`MAX_WILDCARDS = 15`**: The threshold for an acceptable number of rejected/unique answers. 
* **`QUOTES_PER_CLUSTER = 2`**: The number of flavor quotes to generate and attach to each main board answer.

## 3. Hardware & Model Specifications

*Target Hardware: M1 MacBook Pro, 32GB Unified Memory.*

### Model 1: The Surveyor (Creative Generation & Flavor Quotes)
* **Task:** Run 100 isolated, fast requests to generate raw persona answers, followed by targeted requests for flavor quotes.
* **Model:** `Hermes-3-Llama-3.1-8B-lorablated`.
* **Why:** Blazing fast execution (~40+ tokens/sec). Small memory footprint allows batching concurrent requests without crashing the local server. High variance for weird, unhinged responses.

### Model 2: The Clusterer (Semantic Reasoning)
* **Task:** Group 100 chaotic strings into 5-8 logical buckets and identify outliers.
* **Model:** `Qwen-2.5-32B-Instruct` (Quantization: Q4_K_M or Q5_K_M).
* **Why:** Requires massive semantic reasoning to group abstract concepts accurately and adhere to complex JSON instructions. Runs once per topic, so slower execution (~10 tokens/sec) is acceptable.

---

## 4. Pipeline Execution Steps

### Step 1: Surveying (`survey.ts`)
**Goal:** Gather 100 uncontaminated short answers per Topic.

1. Load `personas-v1.json` and target `Topic`.
2. **Execution Loop:** Map over the 100 personas using `CONCURRENCY_LIMIT`.
   * **Prompt (All 100 Personas):** "You are [Persona Description]. Answer the topic: [Topic]. Respond in 1-4 words. Output JSON: `{ "answer": "..." }`."
3. Save raw output to a temporary JSON file (e.g., `/output/raw/[topicId].json`).

### Step 2: Clustering (`cluster.ts` - Semantic Pass)
**Goal:** Group the 100 raw strings using the 32B Model.

1. Load the raw JSON output from Step 1 and pass the array of 100 raw answers to the Clustering LLM.
2. **LLM Instructions:**
   * Create exactly 5 to 8 broad `clusters`.
   * A cluster MUST contain >= 3 raw answers.
   * Generate a `canonicalName` and an array of `synonyms` for each cluster.
   * Reject highly unique or bizarre answers ( < 3 overlaps) into a `wildcards` array.
3. Validate the LLM output against the expected JSON structure.
   * **TODO (Post-MVP):** *If the number of wildcards exceeds `MAX_WILDCARDS`, the question is too fragmented. We will eventually need logic to recluster, resurvey, or drop the topic. For MVP, we will simply proceed and accept the high wildcard count.*

### Step 3: Reconciliation & Quote Generation (`cluster.ts` - Math & Flavor Pass)
**Goal:** Convert raw counts to a perfect 100-point board, and fetch targeted quotes using the 8B model.

1. **Calculate Base Scores:** For the `N` items successfully placed into main clusters (e.g., 80 items), calculate the percentage for each cluster: `P = (Raw Count / N) * 100`.
2. **Largest Remainder Method:**
   * Assign integer base scores: `Math.floor(P)`.
   * Sum base scores. Calculate the shortfall from 100 (e.g., 100 - 98 = 2).
   * Distribute 1 point each to the clusters with the highest decimal remainders until the total is exactly 100.
3. **Targeted Quote Generation:**
   * Iterate through the finalized `clusters`. Pick `QUOTES_PER_CLUSTER` random personas from that cluster's assigned raw answers.
   * Iterate through all `wildcards`.
   * **Execution Loop:** Send an isolated API call back to the 8B Surveyor model for each selected persona: *"You are [Persona]. You answered [Answer]. Give a 1-sentence quote explaining why. Output JSON: `{ "quote": "..." }`."*
   * Map the returned strings to the `flavorQuotes` array (for clusters) and `flavorQuote` object (for wildcards) as defined in `schema.md`.
4. **Save:** Output the final compiled `SurveyResultDocument` to `/scripts/data-generation/output/`.

---

## 5. TDD Implementation Guidelines

For the Implementer/TDD agents, adhere to the following logic boundaries:

1. **`survey.ts` & `cluster.ts`**:
   * Implement as separate executable scripts (e.g., `npx tsx scripts/data-generation/survey.ts`).
   * Use native `fetch` API to communicate with `http://127.0.0.1:1234/v1/chat/completions`.
   * Implement robust retry logic (up to 3 times) for JSON parsing failures.
   
2. **Unit Testing (`/tests/lib/data-pipeline/`)**:
   * Write tests for the **Largest Remainder Normalization** function *before* implementation. Pass mock arrays like `[33, 33, 34]` vs `[10, 10, 80]` out of `N=75` to prove the math always scales to exactly 100 points.
   * Write tests mapping the hybridized LLM outputs (cluster data + newly generated quotes) into standard `SurveyResultDocument` structures.
