# Data Generation Pipeline: Criteria & Examples

This document identifies the quality criteria for each stage of the AI-Feud data generation pipeline and provides "Gold Standard" examples to guide local model fine-tuning or prompt engineering.

## 1. Quality Criteria by Pipeline Step

### Stage A: Survey Generation (`survey-prompts.ts`)
*Goal: Generate 100 character-driven yet clusterable responses.*

| Criterion | Requirement | Rationale |
| :--- | :--- | :--- |
| **Conciseness** | 1–4 words | Fits the "Family Feud" board UI and simplifies matching. |
| **Semantic Consistency** | High | **Crucial:** Avoid flavor text (e.g., "AARGH", "Ugh") in the answer. The *content* should be in-character, but the *phrasing* should be standard for clustering. |
| **Character Fidelity** | Conceptual | The choice of answer should reflect the persona, not the delivery style. |
| **JSON Integrity** | Valid | Must strictly follow `{ "answer": "..." }`. |

---

### Stage B: Semantic Clustering - Map (`cluster-prompts.ts`)
*Goal: Extract 5–8 core themes that fit the topic format.*

| Criterion | Requirement | Rationale |
| :--- | :--- | :--- |
| **Grammatical Fit** | High | **Primary:** The `uiText` must correctly complete the topic prompt (especially for "Fill in the blank" topics). |
| **Exclusivity** | No overlap | Categories should be conceptually distinct. |
| **Coverage** | >80% | Most raw answers should fit into the extracted categories. |
| **Clarity** | Descriptive | `aiPromptName` must be clear enough for the "Reduce" stage. |

---

### Stage C: Semantic Clustering - Reduce (`cluster-prompts.ts`)
*Goal: Assign every raw answer to a category or mark as a WildCard.*

| Criterion | Requirement | Rationale |
| :--- | :--- | :--- |
| **Completeness** | 100% assignment | Every input `personaId` must be accounted for in the output. |
| **Exclusivity** | No overlap | Every answer should be assigned to only one category. |
| **Specificity** | Best Fit | Answers must go to the most semantically relevant category. |
| **Determinism** | No Hallucinations | Do not invent new categories; use only the IDs provided by the Map stage. |

---

### Stage D: Enrichment - Synonyms (`synonyms-prompts.ts`)
*Goal: Expand matching capabilities for the Game Engine.*

| Criterion | Requirement | Rationale |
| :--- | :--- | :--- |
| **Semantic Equivalence** | Strict | Synonyms must mean the *same thing* as the category. |
| **Synonym is a subset of category** | Strict | A synonym can be a subset of category for matching purposes. e.g. category is "Drinks" and synonym is "Water". Only if this subset don't match other category more strongly. |
| **Varied Phrasing** | High | Include common shorthand, slang, or potential player typos. |
| **Short** | 1-3 words | Must fit the potential player input |
| **Exclusion** | No Duplicates | Do not repeat the cluster's `uiText`. |

---

### Stage E: Enrichment - Quotes (`quotes-prompts.ts`)
*Goal: Provide "flavor" text for the UI when a cluster is revealed.*

| Criterion | Requirement | Rationale |
| :--- | :--- | :--- |
| **Tone Matching** | High | This is where the persona's "AARGH" and character voice belong. |
| **Contextual Link** | Direct | The quote must reference their specific raw answer and the cluster theme. |
| **Brevity** | <15 words | Must fit in small UI speech bubbles. |

---

## 2. "Gold Standard" Example Output

**Topic:** "I like my friends as I like my ___"

### Step 1: Survey (Raw Output Samples)
```json
// Persona: "18th Century Pirate"
{ "answer": "Rum" } // Good: In-character content, clean phrasing. Not "AARGH, ME RUM!"

// Persona: "Snobby Barista"
{ "answer": "Coffee" }

// Persona: "Dog Owner"
{ "answer": "Dog" }

// Persona: "Person on a quarantine"
{ "answer": "Cat" }
```

### Step 2: Cluster - Map (Extracted Categories)
```json
{
  "categories": [
    {
      "id": "beverages",
      "uiText": "Drink", // Fits: "I like my friends as I like my Drink"
      "aiPromptName": "Drinkable liquids: coffee, rum, wine."
    },
    {
      "id": "pets",
      "uiText": "Pet animal", // Fits: "I like my friends as I like my Pet animal"
      "aiPromptName": "Pets, animals"
    }
  ]
}
```

### Step 3: Cluster - Reduce 
```json
{
  "assignments": [
    {
      "personaId": "pirate",
      "assignedCategory": "beverages"
    },
    {
      "personaId": "snobby-barista",
      "assignedCategory": "beverages"
    },
    {
      "personaId": "dog-owner",
      "assignedCategory": "pets"
    },
    {
      "personaId": "person-quarantine",
      "assignedCategory": "pets"
    },
    {
      "personaId": "clueless-referee", // rawAnswer: whistle
      "assignedCategory": "wildcard"
    }
  ]
}
```

### Step 4: Enrichment - Synonyms (For "beverages" category)
```json
{
  "synonyms": [
    "coffee",
    "rum",
    "wine",
    "tea",
    "juice"
  ]
}
```

### Step 5: Enrichment - Quotes (Persona-specific)
```json
{
  "quotes": [
    {
      "personaId": "pirate",
      "personaName": "18th Century Pirate",
      "text": "I like my friends like my rum! I only trust what I can drink!" // Flavor quote for "beverages"
    },
    {
      "personaId": "dog-owner",
      "personaName": "Dog Owner",
      "text": "I like my friends like my dog! Loyal, furry, and always happy to see me!" // Flavor quote for "pets"
    },
    {
      "personaId": "clueless-referee",
      "personaName": "Clueless Referee",
      "text": "I like my friends like my whistle! Always ready to blow the whistle!" // Flavor quote for "wildcard"
    }
  ]
}
```
