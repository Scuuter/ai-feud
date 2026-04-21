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
  /** Other cluster answers already on the board — used to exclude ambiguous synonyms. */
  siblingClusterTexts?: string[];
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

/**
 * Builds the prompt for generating 3-5 short synonym terms for a cluster answer.
 * These are used for fuzzy player-input matching in the game engine.
 */
export function buildSynonymPrompt(input: SynonymJobInput): string {
  const siblingBlock =
    input.siblingClusterTexts && input.siblingClusterTexts.length > 0
      ? `\nOTHER ANSWERS ALREADY ON THE BOARD (do not generate synonyms that fit these better than the cluster answer above):\n${input.siblingClusterTexts.map(t => `- "${t}"`).join('\n')}\n`
      : '';

  return `You are a game show writer for a "Family Feud" style show.

TOPIC: "${input.topicText}"
CLUSTER ANSWER: "${input.clusterText}"
${siblingBlock}
TASK: Generate 3 to 5 short synonyms for the CLUSTER ANSWER above. These will be used to match what players type when guessing, so they must be short and cover the most likely variations a player would type.

Rules:
- Each synonym must be 1–3 words maximum. No sentences or phrases.
- Synonyms must mean the same thing as the cluster answer, OR be a specific subset of it (e.g. "Water" is valid for "Drinks", but only if "Water" wouldn't more strongly match a different cluster).
- If a word fits another board answer more precisely, exclude it.
- Include common shorthand, slang, and likely player typos.
- Do NOT repeat the cluster answer text itself.
- Do NOT include broader/parent concepts — only equivalents or subsets.

Output ONLY valid JSON according to the schema.`;
}
