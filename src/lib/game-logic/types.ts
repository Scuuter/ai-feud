/**
 * src/lib/game-logic/types.ts
 *
 * Single source of truth for all Layer B (game engine) types.
 * These interfaces mirror schema.md exactly.
 *
 * IMPORTANT: Do NOT import from scripts/data-generation/types.ts here.
 * Layer B is 100% isolated from Layer A pipeline code.
 */

// ─── Static Content Entities ─────────────────────────────────────────────────

export interface FlavorQuote {
  /** The identity of the AI that gave this response */
  personaName: string;
  /** The exact raw string they provided */
  text: string;
}

export interface AnswerCluster {
  /** The primary display text on the board */
  text: string;
  /** The frequency (number of AI personas out of 100 that gave this answer) */
  score: number;
  /** Persona IDs assigned to this cluster; used by enrichment.ts */
  personaIds: string[];
  /** Valid variations and typos for Exact/Fuzzy matching */
  synonyms: string[];
  /** Curated quotes from specific personas to show in the UI */
  flavorQuotes: FlavorQuote[];
}

export interface WildCard {
  /** The identity of the AI that gave this response */
  personaId: string;
  /** The persona's original raw survey answer */
  rawAnswer: string;
  /** Valid variations for Exact/Fuzzy matching (reserved; empty until enriched) */
  synonyms: string[];
  /** Curated quote from this persona for flavor text in the UI */
  flavorQuote: FlavorQuote;
}

export interface SurveyResult {
  /** Unique identifier (MongoDB ObjectId string or topicId) */
  id: string;
  /** The core setup presented to the players */
  topicText: string;
  /** The theme defining the 100 AI Personas */
  demographicName: string;
  /** The aggregated top answers, sorted by score (highest to lowest) */
  clusters: AnswerCluster[];
  /** Unique answers that couldn't be categorised into any cluster */
  wildcards: WildCard[];
  /** Optional tags for categorization */
  tags?: string[];
  /** ISO 8601 timestamp set by enrichment.ts; absence means not enriched */
  enrichedAt?: string;
}

// ─── Runtime State Entities ───────────────────────────────────────────────────

export interface Player {
  /** Local session ID (Phase 1) or Multiplayer ID (Phase 2) */
  id: string;
  /** Running total of points accumulated */
  scoreTracker: number;
}

export interface Guess {
  /** The raw text input submitted by the player */
  rawInput: string;
  /** Timestamp of submission */
  submittedAt: number;
}

export interface Strike {
  /** The guess that triggered the penalty */
  failedGuess: string;
  /** Visual indicator level (1, 2, or 3) */
  strikeNumber: 1 | 2 | 3;
}

export interface Round {
  /** The active survey data fetched from MongoDB */
  activeSurvey: SurveyResult;
  /** Array of clusters the player has successfully guessed */
  revealedClusters: AnswerCluster[];
  /** Discrete penalty objects recorded when guesses fail validation */
  strikes: Strike[];
  /** True when the board is cleared or 3 strikes reached */
  isComplete: boolean;
}

// ─── Matcher Configuration ────────────────────────────────────────────────────

/** Controls how fuzzy distance is computed across multi-word answers */
export type FuzzyStrategy =
  | 'whole-string' // Levenshtein on entire normalized string at once
  | 'per-word';    // Split on spaces; ≥ minWordMatchRatio of words must be within threshold

export interface MatcherConfig {
  /** Maximum Levenshtein distance to accept as a fuzzy match. Default: 2 */
  threshold?: number;
  /** Fuzzy computation strategy. Default: 'per-word' */
  fuzzyStrategy?: FuzzyStrategy;
  /** Minimum ratio of input words matching within threshold (per-word only). Default: 0.66 */
  minWordMatchRatio?: number;
}

// ─── Matcher Result ───────────────────────────────────────────────────────────

export type MatchResult =
  | { matched: true;  target: AnswerCluster; matchType: 'exact' | 'synonym' | 'fuzzy'; isWildCard: false }
  | { matched: true;  target: WildCard;      matchType: 'exact' | 'synonym' | 'fuzzy'; isWildCard: true  }
  | { matched: false };
