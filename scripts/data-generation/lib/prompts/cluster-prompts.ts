/**
 * Cluster prompt builders — pure functions, no side effects, no I/O.
 * Extracted from cluster.ts.
 */

// ─── Schema objects ────────────────────────────────────────────────────────

export const extractCategoriesSchema = {
  name: 'extract_categories',
  schema: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            uiText: { type: 'string' },
            aiPromptName: { type: 'string' },
          },
          required: ['id', 'uiText', 'aiPromptName'],
        },
        minItems: 5,
        maxItems: 8,
      },
    },
    required: ['categories'],
  },
};

export const assignClustersChunkSchema = {
  name: 'assign_clusters_chunk',
  schema: {
    type: 'object',
    properties: {
      assignments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            personaId: { type: 'string' },
            assignedCategory: { type: 'string' },
          },
          required: ['personaId', 'assignedCategory'],
        },
      },
    },
    required: ['assignments'],
  },
};

// ─── Input interfaces ───────────────────────────────────────────────────────

export interface ExtractCategoriesInput {
  topicText: string;
  answers: string[];
  answerCount: number;
}

export interface AssignChunkInput {
  topicText: string;
  categoriesList: string;  // pre-serialised JSON string
  chunkCount: number;
  answersList: string;     // pre-serialised JSON string
}

// ─── Prompt builders ────────────────────────────────────────────────────────

/**
 * Builds the Map-stage prompt that extracts 5-8 core categories from raw answers.
 */
export function buildExtractCategoriesPrompt(input: ExtractCategoriesInput): string {
  const answersBlock = input.answers.join('\n');
  return `You are a semantic analyst for a "Family Feud" style game show. 
TOPIC: "${input.topicText}"

RAW ANSWERS:
${answersBlock}

TASK: Analyze the ${input.answerCount} answers and extract 5 to 8 core categories that represent the most frequent semantic themes.
GOAL: Maximize coverage so that most raw answers fit into one of these categories. Ensure categories do not overlap.

For each category, provide:
1. "id": A strict, lowercase-kebab-case identifier (e.g., "locked-doors").
2. "uiText": A short noun or noun phrase that correctly completes the topic sentence. For fill-in-the-blank topics it slots into the blank; for non-blank topics it is a concise answer phrase. Examples: "Drink", "Pet animal", "Brush teeth".
3. "aiPromptName": A concrete noun enumeration naming the semantic bucket with representative examples (e.g., "Drinkable liquids: coffee, rum, wine.").

Output ONLY valid JSON according to the schema.`;
}

/**
 * Builds the Reduce-stage prompt that assigns a chunk of persona answers to categories.
 */
export function buildAssignChunkPrompt(input: AssignChunkInput): string {
  return `You are a deterministic data mapping engine.
TOPIC: "${input.topicText}"

TASK: Map each of the ${input.chunkCount} personaIds to the MOST SPECIFIC category from the list below. Set assignedCategory to the category's identifier string value (the value of its id field, e.g. "emergency-escape", "beverages") — NOT the word "id".

CATEGORIES:
${input.categoriesList}

STRICT RULES:
1. You MUST choose an exact "id" from the Categories array for assignedCategory.
2. COMPLETENESS: Every personaId from the input MUST appear in the output exactly once. Do not skip, merge, or omit any entry.
3. DO NOT modify, shorten, or make up new ids.
4. WILDCARD LAST RESORT: Only assign "wildcard" if the answer has no meaningful semantic relationship with ANY other category. Before assigning "wildcard", check the answer against every other category's description.
5. No reasoning, no chatter. Output ONLY valid JSON according to the schema.

ANSWERS TO MAP:
${input.answersList}`;
}
