# Product Requirements Document: Layer A (Data Pipeline)

## 1. Executive Summary

This pipeline (`scripts/data-generation/`) orchestrates the offline generation of MVP content for "Survey Says: AI Feud". It takes a list of `Topics` and `Personas` and uses local LLMs to generate 100 isolated AI responses. It then semantically clusters those responses into `AnswerCluster`s (for the main game board) and `WildCard`s (for exact-match easter eggs), performing strict mathematical normalization so the main board always totals exactly 100 points. 

Currently, the orchestration is separated into distinct CLI scripts (e.g., `survey.ts`, `cluster.ts`, with a planned `enrichment.ts` for separating concerns and preserving LLM context).

## 2. Pipeline Configuration Constants

The following parameters dictate the execution flow and limits of the pipeline. These should be defined as constants in the code to allow easy refinement during testing:

* **`CONCURRENCY_LIMIT = 4`**: The maximum number of simultaneous requests sent to the local LM Studio server. (Prevents overloading an M1 Mac with 32GB RAM).
* **`QUOTES_PER_CLUSTER = 2`**: The number of flavor quotes to generate and attach to each main board answer.
* **`MAX_RETRIES = 3`**: Intended maximum number of retry attempts. *(Note: Currently, scripts pass `undefined` to the retry wrapper, defaulting to 1 attempt. This needs to be wired up correctly).*

## 3. Hardware & Model Specifications

*Target Hardware: M1 MacBook Pro, 32GB Unified Memory.*

> **TODO:** Reassess the following model setup and presets during the switch to the map-reduce architecture.

### Current Models Setup

1. **Survey Model Preset**
* **Task:** Run 100 isolated, fast requests to generate raw persona answers, followed by targeted requests for flavor quotes.
* **Model:** `hermes-3-llama-3.1-8b-lorablated`
* **Context Length:** 2048 (This model only reads a 1-sentence prompt and outputs 1-4 words. Keeping this low allows for high concurrency without crashing).
* **GPU Offload:** Max
* **KV Cache:** Enable Flash Attention.
* **Context Overflow:** "Stop at limit".
* **Structured Output (JSON Mode):** OFF.

2. **Cluster Model Preset**
* **Task:** Group chaotic strings into logical buckets and identify outliers.
* **Model:** `google/gemma-4-26b-a4b`
* **Context Length:** 32000 tokens 
* **GPU Offload:** Max
* **KV Cache:** Enable Flash Attention.
* **Context Overflow:** "Stop at limit".
* **Structured Output (JSON Mode):** OFF.

---

## 4. Pipeline Execution: Current State vs. Planned Architecture

### Current State (Obsolete / Monolithic)
Currently, `cluster.ts` handles semantic reasoning, math, and flavor quote generation in a single monolithic run, which causes cognitive overload for the LLM. 

1. **`survey.ts`**: Maps over 100 personas and uses `CONCURRENCY_LIMIT` to gather short answers per Topic. Saves to `/output/raw/`.
2. **`cluster.ts` (Zero-Shot Pass)**: Attempts to group the 100 raw strings into 5-8 clusters in a single massive prompt, resulting in hallucinated IDs and missing synonyms.
3. **`cluster.ts` (Math & Flavor Pass)**: Calculates Base Scores, distributes remainder points to reach exactly 100, and sequentially generates flavor quotes for clusters and wildcards using the 8B model.

---

### Planned Architecture: Multi-Stage Map-Reduce Pipeline
To prevent cognitive overload, decouple concerns, and preserve LLM context, the pipeline will be refactored into the following clear stages:

#### Step 1: Surveying (`survey.ts`)
**Goal:** Gather 100 uncontaminated short answers per Topic.
1. Map over 100 personas using `CONCURRENCY_LIMIT`.
2. Generate unified, punchy short answers to prepare for better clusterization.
3. Save raw output.

#### Step 2: Clustering (`cluster.ts` - Map-Reduce Semantic Pass)
**Goal:** Group the 100 raw strings into core concepts using a map-reduce flow.
1. **Stage 1 (Map - Concept Extraction):** Pass the 100 responses and the *original topic context* to the Clustering LLM to extract 5-8 core, punchy concepts. No ID tracking is done here.
2. **Stage 2 (Reduce - Assignment):** Map each of the 100 raw answers to one of the identified clusters, or relegate them to the `wildcards` array if they don't fit.
3. **Stage 3 (Math Normalization):** Convert raw counts to a perfect 100-point board using the Largest Remainder Method:
   * Calculate base scores: `Math.floor((Raw Count / Total Clustered) * 100)`.
   * Sum base scores and distribute remaining points to clusters with the highest decimal remainders until the total is exactly 100. (Wildcards are saved separately and do not count towards the 100 score).

#### Step 3: Enrichment (`enrichment.ts` - Synonyms & Flavor Pass)
**Goal:** Generate game-show synonyms and fetch targeted quotes using the fast Survey model.
1. **Synonym Generation:** Pass the normalized clusters through the LLM to generate 3-5 valid game-show synonyms per answer.
2. **Targeted Quote Generation:**
   * Iterate through the finalized `clusters`. Pick `QUOTES_PER_CLUSTER` random personas from that cluster's assigned raw answers.
   * Iterate through all `wildcards`.
   * Send isolated API calls back to the Surveyor model for each selected persona to generate a flavor quote.
3. **Save:** Output the final compiled `SurveyResultDocument`.

---

## 5. TDD Implementation Guidelines

For the Implementer/TDD agents, adhere to the following logic boundaries:

1. **`survey.ts` & `cluster.ts`**:
   * Implement as separate executable scripts (e.g., `npx tsx scripts/data-generation/survey.ts`).
   * Use native `fetch` API to communicate with `http://127.0.0.1:1234/v1/chat/completions`.
   * **Crucial:** Use Server-Sent Events (SSE) streaming (`stream: true`) to maintain visibility into model execution and avoid silent timeouts on long generations.
   * Implement robust retry logic (up to `MAX_RETRIES`) for JSON parsing failures or network drops.
   
2. **Unit Testing (`/tests/lib/data-pipeline/`)**:
   * Write tests for the **Largest Remainder Normalization** function *before* implementation. Pass mock arrays like `[33, 33, 34]` vs `[10, 10, 80]` out of `N=75` to prove the math always scales to exactly 100 points.
   * Write tests mapping the hybridized LLM outputs (cluster data + newly generated quotes) into standard `SurveyResultDocument` structures.
