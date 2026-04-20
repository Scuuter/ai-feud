/**
 * src/lib/game-logic/Matcher.ts
 *
 * Pure functions for validating player guesses against answer clusters and wildcards.
 * Step 1: Exact / lowercase match (cluster.text, cluster.synonyms, wildcard.rawAnswer, wildcard.synonyms)
 * Step 2: Fuzzy matching via fast-levenshtein (per-word strategy by default, whole-string selectable)
 *
 * Semantic LLM validation is explicitly deferred to Phase 2.
 * No React, Next.js, or DOM imports.
 */
import levenshtein from 'fast-levenshtein';
import type { AnswerCluster, WildCard, Guess, MatchResult, MatcherConfig } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLD = 2;
const DEFAULT_STRATEGY = 'per-word' as const;
const DEFAULT_MIN_WORD_RATIO = 0.66;
/** Words shorter than this length are excluded from fuzzy evaluation (exact only) */
const MIN_WORD_LENGTH_FOR_FUZZY = 4;

// ─── normalizeInput ───────────────────────────────────────────────────────────

/**
 * Normalises a string for case-insensitive comparison:
 * lowercase → trim → collapse internal whitespace.
 * Punctuation is preserved (it may be significant in cluster names).
 */
export function normalizeInput(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Per-word fuzzy check between a normalised input and a normalised candidate.
 *
 * Algorithm:
 *   1. Split both strings on whitespace.
 *   2. For each input word (length ≥ MIN_WORD_LENGTH_FOR_FUZZY), find the
 *      closest candidate word by Levenshtein distance.
 *   3. Count input words where minDistance ≤ threshold.
 *      Short input words (< MIN_WORD_LENGTH_FOR_FUZZY) require exact match.
 *   4. Accept when matchedWords / totalInputWords ≥ minWordMatchRatio.
 */
function perWordFuzzyMatch(
  normInput: string,
  normCandidate: string,
  threshold: number,
  minWordMatchRatio: number,
): boolean {
  const inputWords = normInput.split(' ');
  const candidateWords = normCandidate.split(' ');

  if (inputWords.length === 0) return false;

  let matchedWords = 0;

  for (const inputWord of inputWords) {
    if (inputWord.length < MIN_WORD_LENGTH_FOR_FUZZY) {
      // Short words: must match exactly within candidate words
      if (candidateWords.includes(inputWord)) {
        matchedWords++;
      }
    } else {
      // Longer words: find nearest candidate word by Levenshtein
      const minDist = candidateWords.reduce(
        (best, cw) => Math.min(best, levenshtein.get(inputWord, cw)),
        Infinity,
      );
      if (minDist <= threshold) {
        matchedWords++;
      }
    }
  }

  return matchedWords / inputWords.length >= minWordMatchRatio;
}

/**
 * Whole-string fuzzy check — computes Levenshtein on the full normalised string.
 */
function wholeStringFuzzyMatch(
  normInput: string,
  normCandidate: string,
  threshold: number,
): boolean {
  return levenshtein.get(normInput, normCandidate) <= threshold;
}

/**
 * Checks whether normInput fuzzy-matches normCandidate according to the given config.
 */
function fuzzyMatchesCandidate(
  normInput: string,
  normCandidate: string,
  threshold: number,
  strategy: 'per-word' | 'whole-string',
  minWordMatchRatio: number,
): boolean {
  if (strategy === 'whole-string') {
    return wholeStringFuzzyMatch(normInput, normCandidate, threshold);
  }
  return perWordFuzzyMatch(normInput, normCandidate, threshold, minWordMatchRatio);
}

// ─── exactMatch ───────────────────────────────────────────────────────────────

/**
 * Step 1: Exact (case-insensitive) matching.
 * Checks clusters first (text then synonyms), then wildcards (rawAnswer then synonyms).
 * Returns on the first hit — clusters take priority over wildcards.
 */
export function exactMatch(
  input: string,
  clusters: AnswerCluster[],
  wildcards: WildCard[],
): MatchResult {
  const norm = normalizeInput(input);

  // Check clusters
  for (const cluster of clusters) {
    if (normalizeInput(cluster.text) === norm) {
      return { matched: true, target: cluster, matchType: 'exact', isWildCard: false };
    }
    for (const synonym of cluster.synonyms) {
      if (normalizeInput(synonym) === norm) {
        return { matched: true, target: cluster, matchType: 'synonym', isWildCard: false };
      }
    }
  }

  // Check wildcards
  for (const wildcard of wildcards) {
    if (normalizeInput(wildcard.rawAnswer) === norm) {
      return { matched: true, target: wildcard, matchType: 'exact', isWildCard: true };
    }
    for (const synonym of wildcard.synonyms) {
      if (normalizeInput(synonym) === norm) {
        return { matched: true, target: wildcard, matchType: 'synonym', isWildCard: true };
      }
    }
  }

  return { matched: false };
}

// ─── fuzzyMatch ───────────────────────────────────────────────────────────────

/**
 * Step 2: Fuzzy matching via fast-levenshtein.
 * Checks clusters first (text then synonyms), then wildcards (rawAnswer then synonyms).
 * Returns on the first hit — clusters take priority over wildcards.
 *
 * @param input    - Raw player input (normalisation applied internally)
 * @param clusters - Unrevealed AnswerClusters to match against
 * @param wildcards - Un-matched WildCards to match against
 * @param config   - Optional MatcherConfig (threshold, strategy, minWordMatchRatio)
 */
export function fuzzyMatch(
  input: string,
  clusters: AnswerCluster[],
  wildcards: WildCard[],
  config?: MatcherConfig,
): MatchResult {
  const norm = normalizeInput(input);
  const threshold = config?.threshold ?? DEFAULT_THRESHOLD;
  const strategy = config?.fuzzyStrategy ?? DEFAULT_STRATEGY;
  const minWordMatchRatio = config?.minWordMatchRatio ?? DEFAULT_MIN_WORD_RATIO;

  const isMatch = (candidate: string) =>
    fuzzyMatchesCandidate(norm, normalizeInput(candidate), threshold, strategy, minWordMatchRatio);

  // Check clusters
  for (const cluster of clusters) {
    if (isMatch(cluster.text)) {
      return { matched: true, target: cluster, matchType: 'fuzzy', isWildCard: false };
    }
    for (const synonym of cluster.synonyms) {
      if (isMatch(synonym)) {
        return { matched: true, target: cluster, matchType: 'fuzzy', isWildCard: false };
      }
    }
  }

  // Check wildcards
  for (const wildcard of wildcards) {
    if (isMatch(wildcard.rawAnswer)) {
      return { matched: true, target: wildcard, matchType: 'fuzzy', isWildCard: true };
    }
    for (const synonym of wildcard.synonyms) {
      if (isMatch(synonym)) {
        return { matched: true, target: wildcard, matchType: 'fuzzy', isWildCard: true };
      }
    }
  }

  return { matched: false };
}

// ─── matchGuess ───────────────────────────────────────────────────────────────

/**
 * Orchestrator: runs exact → fuzzy in sequence and returns the first hit.
 *
 * Caller's responsibility:
 *  - Pass only unrevealed clusters (filter out revealedClusters before calling)
 *  - Pass only un-matched wildcards
 *  - Interpret isWildCard: true as a 0-point hit (flavor quote only)
 *
 * @param guess    - The Guess submitted by the player
 * @param clusters - Unrevealed AnswerClusters
 * @param wildcards - Un-matched WildCards
 * @param config   - Optional MatcherConfig
 */
export function matchGuess(
  guess: Guess,
  clusters: AnswerCluster[],
  wildcards: WildCard[],
  config?: MatcherConfig,
): MatchResult {
  const exact = exactMatch(guess.rawInput, clusters, wildcards);
  if (exact.matched) return exact;

  return fuzzyMatch(guess.rawInput, clusters, wildcards, config);
}
