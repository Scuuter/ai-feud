/**
 * Prompt Registry — typed registry of all prompt descriptors.
 *
 * Maps string keys to PromptDescriptors consumed by prompt-tester.ts.
 * Also re-exports all prompt builder functions and schemas so scripts
 * can import from a single location.
 *
 * Use `prompt-tester.ts` to test individual prompts against a live LM Studio instance.
 */

// ─── Imports ──────────────────────────────────────────────────────────────────

import {
  buildSurveyPrompt,
  type SurveyAnswerInput,
} from './survey-prompts.js';

import {
  buildExtractCategoriesPrompt,
  buildAssignChunkPrompt,
  extractCategoriesSchema,
  assignClustersChunkSchema,
  type ExtractCategoriesInput,
  type AssignChunkInput,
} from './cluster-prompts.js';

import {
  buildSynonymPrompt,
  synonymJobSchema,
  type SynonymJobInput,
} from './synonyms-prompts.js';

import {
  buildClusterQuotePrompt,
  buildWildcardQuotePrompt,
  clusterQuoteJobSchema,
  wildcardQuoteJobSchema,
  type ClusterQuoteJobInput,
  type WildcardQuoteJobInput,
} from './quotes-prompts.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export * from './survey-prompts.js';
export * from './cluster-prompts.js';
export * from './synonyms-prompts.js';
export * from './quotes-prompts.js';

// ─── Registry type ────────────────────────────────────────────────────────────

export interface PromptDescriptor {
  name: string;
  description: string;
  /** Fixture data used for manual testing via prompt-tester.ts */
  defaultFixture: Record<string, unknown>;
  build: (input: Record<string, unknown>) => string;
  schema?: Record<string, unknown>;
  /** Suggested model and params for this prompt */
  suggestedModel: 'small' | 'large';
  suggestedMaxTokens: number;
  suggestedTemperature: number;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PROMPT_REGISTRY: Record<string, PromptDescriptor> = {
  'survey:persona-answer': {
    name: 'Survey: Persona Answer',
    description: 'Generates a short raw survey answer from the perspective of a persona.',
    defaultFixture: {
      personaDescription: 'a paranoid conspiracy theorist who sees patterns everywhere',
      topicAiPrompt: 'Name something you always check before leaving the house.',
    } satisfies SurveyAnswerInput,
    build: (input) => buildSurveyPrompt(input as unknown as SurveyAnswerInput),
    suggestedModel: 'small',
    suggestedMaxTokens: 100,
    suggestedTemperature: 0.6,
  },

  'cluster:extract-categories': {
    name: 'Cluster: Extract Categories',
    description: 'Map stage — extracts 5-8 core semantic categories from 100 raw survey answers.',
    defaultFixture: {
      topicText: 'Name something you always check before leaving the house.',
      answers: ['keys', 'phone', 'wallet', 'doors locked', 'stove off', 'lights', 'windows', 'passport'],
      answerCount: 8,
    } satisfies ExtractCategoriesInput,
    build: (input) => buildExtractCategoriesPrompt(input as unknown as ExtractCategoriesInput),
    schema: extractCategoriesSchema,
    suggestedModel: 'large',
    suggestedMaxTokens: 16000,
    suggestedTemperature: 0.7,
  },

  'cluster:assign-chunk': {
    name: 'Cluster: Assign Chunk',
    description: 'Reduce stage — maps a chunk of persona answers to the extracted categories.',
    defaultFixture: {
      topicText: 'Name something you always check before leaving the house.',
      categoriesList: JSON.stringify([
        { id: 'keys-phone-wallet', description: 'Essential personal items: keys, phone, wallet' },
        { id: 'locked-secured', description: 'Checking doors, windows, or locks are secure' },
        { id: 'appliances-off', description: 'Ensuring appliances like stoves or lights are off' },
        { id: 'wildcard', description: 'Completely outlier or nonsensical answers' },
      ], null, 2),
      chunkCount: 3,
      answersList: JSON.stringify([
        { id: 'persona-001', text: 'my keys and wallet' },
        { id: 'persona-002', text: 'that I turned off the stove' },
        { id: 'persona-003', text: 'my lucky rabbit foot' },
      ], null, 2),
    } satisfies AssignChunkInput,
    build: (input) => buildAssignChunkPrompt(input as unknown as AssignChunkInput),
    schema: assignClustersChunkSchema,
    suggestedModel: 'small',
    suggestedMaxTokens: 3000,
    suggestedTemperature: 0,
  },

  'enrichment:cluster-synonyms': {
    name: 'Enrichment: Cluster Synonyms',
    description: 'Generates 3-5 game-show phrasing variations for a cluster answer.',
    defaultFixture: {
      clusterText: 'Keys & Wallet',
      topicText: 'Name something you always check before leaving the house.',
    } satisfies SynonymJobInput,
    build: (input) => buildSynonymPrompt(input as unknown as SynonymJobInput),
    schema: synonymJobSchema,
    suggestedModel: 'large',
    suggestedMaxTokens: 2000,
    suggestedTemperature: 0.7,
  },

  'enrichment:cluster-quote': {
    name: 'Enrichment: Cluster Quote',
    description: 'Generates in-character flavor quotes for selected personas in a cluster.',
    defaultFixture: {
      clusterText: 'Keys & Wallet',
      topicText: 'Name something you always check before leaving the house.',
      selectedPersonas: [
        { personaId: 'persona-001', personaName: 'Angry Chef', toneOfVoice: 'Aggressive', rawAnswer: 'my chef knife' },
        { personaId: 'persona-002', personaName: 'Anxious Teen', toneOfVoice: 'Nervous', rawAnswer: 'wallet and keys obviously' },
      ],
    } satisfies ClusterQuoteJobInput,
    build: (input) => buildClusterQuotePrompt(input as unknown as ClusterQuoteJobInput),
    schema: clusterQuoteJobSchema,
    suggestedModel: 'small',
    suggestedMaxTokens: 500,
    suggestedTemperature: 0.7,
  },

  'enrichment:wildcard-quote': {
    name: 'Enrichment: Wildcard Quote',
    description: 'Generates a single in-character flavor quote for a wildcard persona.',
    defaultFixture: {
      personaId: 'persona-099',
      personaName: 'Conspiracy Theorist',
      toneOfVoice: 'Paranoid',
      rawAnswer: 'that the government isn\'t watching through my TV',
      topicText: 'Name something you always check before leaving the house.',
    } satisfies WildcardQuoteJobInput,
    build: (input) => buildWildcardQuotePrompt(input as unknown as WildcardQuoteJobInput),
    schema: wildcardQuoteJobSchema,
    suggestedModel: 'small',
    suggestedMaxTokens: 500,
    suggestedTemperature: 0.7,
  },
};
