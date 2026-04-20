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
2. "uiText": A punchy, flavorful name for the game board (e.g., "Checking the Locks!").
3. "aiPromptName": A broad description of the semantic bucket to help another AI map synonymous answers (e.g., "Verifying that doors, windows, or gates are locked and secure").

Output ONLY valid JSON according to the schema.`;
}

/**
 * Builds the Reduce-stage prompt that assigns a chunk of persona answers to categories.
 */
export function buildAssignChunkPrompt(input: AssignChunkInput): string {
  return `You are a deterministic data mapping engine.
TOPIC: "${input.topicText}"

TASK: Map each of the ${input.chunkCount} personaIds to the MOST SPECIFIC category "id" from the list below.

CATEGORIES:
${input.categoriesList}

STRICT RULES:
1. You MUST choose an exact "id" from the Categories array for assignedCategory.
2. Every personaId from the input must appear in the output exactly once.
3. DO NOT modify, shorten, or make up new ids.
4. Process the "Raw Answers" list sequentially.
5. No reasoning, no chatter. Output ONLY valid JSON according to the schema.

ANSWERS TO MAP:
${input.answersList}`;
}
