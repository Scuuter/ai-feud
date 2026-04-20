/**
 * Synonym prompt builders — pure functions, no side effects, no I/O.
 * Used by enrichment.ts (Sub-step A: Cluster Synonym Generation).
 */

// ─── Schema ─────────────────────────────────────────────────────────────────

export const synonymJobSchema = {
  name: 'synonym_job',
  schema: {
    type: 'object',
    properties: {
      synonyms: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5,
      },
    },
    required: ['synonyms'],
  },
};

// ─── Input interface ─────────────────────────────────────────────────────────

export interface SynonymJobInput {
  clusterText: string;  // e.g. "Life or Death!"
  topicText: string;
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

/**
 * Builds the prompt for generating 3-5 game-show phrasing variations for a cluster answer.
 */
export function buildSynonymPrompt(input: SynonymJobInput): string {
  return `You are a game show writer for a "Family Feud" style show.

TOPIC: "${input.topicText}"
ANSWER: "${input.clusterText}"

TASK: Generate 3 to 5 alternative phrasing variations of the ANSWER above. These synonyms will be used for fuzzy text matching when players type their guess, so they must semantically match the original answer.

Rules:
- Variations must match the same concept as the original answer (not related concepts).
- Use natural, conversational game-show language.
- Include common typos or shorthand players might type.
- Do NOT include the original answer text itself.

Output ONLY valid JSON according to the schema.`;
}
