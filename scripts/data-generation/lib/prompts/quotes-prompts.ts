/**
 * Quote prompt builders — pure functions, no side effects, no I/O.
 * Used by enrichment.ts (Sub-steps B + C: Cluster + Wildcard Quote Generation).
 */
import type { SelectedPersona } from '../../types.js';
export type { SelectedPersona }; // re-export so existing callers don't break

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const clusterQuoteJobSchema = {
  name: 'cluster_quote_job',
  schema: {
    type: 'object',
    properties: {
      quotes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            personaId: { type: 'string' },
            personaName: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['personaId', 'personaName', 'text'],
        },
      },
    },
    required: ['quotes'],
  },
};

export const wildcardQuoteJobSchema = {
  name: 'wildcard_quote_job',
  schema: {
    type: 'object',
    properties: {
      flavorQuote: {
        type: 'object',
        properties: {
          personaName: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['personaName', 'text'],
      },
    },
    required: ['flavorQuote'],
  },
};

// ─── Input interfaces ─────────────────────────────────────────────────────────

export interface ClusterQuoteJobInput {
  clusterText: string;
  topicText: string;
  selectedPersonas: SelectedPersona[];
}

export interface WildcardQuoteJobInput {
  personaId: string;
  personaName: string;
  toneOfVoice: string;
  rawAnswer: string;
  topicText: string;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

/**
 * Builds the prompt for generating in-character flavor quotes for a cluster answer.
 * Each persona gets one quote; the LLM returns all quotes in a single call.
 */
export function buildClusterQuotePrompt(input: ClusterQuoteJobInput): string {
  const personaBlock = input.selectedPersonas
    .map(
      p =>
        `- personaId: "${p.personaId}", name: "${p.personaName}", tone: "${p.toneOfVoice}", theirAnswer: "${p.rawAnswer}"`
    )
    .join('\n');

  return `You are a game show scriptwriter. Generate short, in-character flavor quotes for the following personas.

TOPIC: "${input.topicText}"
CLUSTER ANSWER (the correct board answer): "${input.clusterText}"

PERSONAS:
${personaBlock}

TASK: For each persona, write a short (max 15 words), in-character quote that sounds like they said it. 
The quote must directly reference their raw answer and connect it to the cluster theme — it should match their tone.

Rules:
- Stay strictly in-character (match the tone field).
- Directly mention their raw answer (theirAnswer) — this is mandatory, not optional.
- Keep it punchy and fun for a game show audience.
- Use the persona's name as the personaName in your output.
- Output ONLY valid JSON according to the schema.`;
}

/**
 * Builds the prompt for generating a single in-character flavor quote for a wildcard.
 */
export function buildWildcardQuotePrompt(input: WildcardQuoteJobInput): string {
  return `You are a game show scriptwriter. Generate a short in-character flavor quote for a given persona.

TOPIC: "${input.topicText}"
PERSONA: "${input.personaName}" (tone: "${input.toneOfVoice}")
THEIR ANSWER: "${input.rawAnswer}"

TASK: Write a short (max 15 words) in-character quote that sounds like this persona said it. 
It should feel like a natural explanation of their answer on a game show.

Rules:
- Stay strictly in-character (match the tone field).
- Mention their answer directly.
- Keep it punchy and fun.
- Use "${input.personaName}" as the personaName in your output.
- Output ONLY valid JSON according to the schema.`;
}
