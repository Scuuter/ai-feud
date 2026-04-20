/**
 * src/lib/game-logic/GameState.ts
 *
 * Pure functions for managing Round state.
 * No mutation — every function returns a new object via spread.
 * No React, Next.js, or DOM imports.
 */
import type { SurveyResult, AnswerCluster, Round, Strike } from './types.js';

// ─── createRound ──────────────────────────────────────────────────────────────

/**
 * Initializes a fresh Round from a SurveyResult.
 * All clusters are hidden; no strikes; board is not complete.
 */
export function createRound(survey: SurveyResult): Round {
  return {
    activeSurvey: survey,
    revealedClusters: [],
    strikes: [],
    isComplete: false,
  };
}

// ─── checkWinCondition ────────────────────────────────────────────────────────

/**
 * Returns true when every cluster in the active survey has been revealed.
 */
export function checkWinCondition(round: Round): boolean {
  return round.revealedClusters.length === round.activeSurvey.clusters.length;
}

// ─── checkLossCondition ───────────────────────────────────────────────────────

/**
 * Returns true when the player has accumulated exactly 3 strikes.
 */
export function checkLossCondition(round: Round): boolean {
  return round.strikes.length >= 3;
}

// ─── isRoundComplete ──────────────────────────────────────────────────────────

/**
 * Returns true when either the win or the loss condition has been met.
 */
export function isRoundComplete(round: Round): boolean {
  return checkWinCondition(round) || checkLossCondition(round);
}

// ─── applyCorrectGuess ────────────────────────────────────────────────────────

/**
 * Returns a new Round with the given cluster added to revealedClusters.
 * Automatically sets isComplete to true if this was the last unrevealed cluster.
 */
export function applyCorrectGuess(round: Round, cluster: AnswerCluster): Round {
  const revealedClusters = [...round.revealedClusters, cluster];
  const nextRound: Round = { ...round, revealedClusters };
  return { ...nextRound, isComplete: isRoundComplete(nextRound) };
}

// ─── applyStrike ──────────────────────────────────────────────────────────────

/**
 * Returns a new Round with a new Strike appended.
 * strikeNumber is derived from the new total (1, 2, or 3).
 * Automatically sets isComplete to true on the 3rd strike.
 */
export function applyStrike(round: Round, failedInput: string): Round {
  const strikeNumber = (round.strikes.length + 1) as 1 | 2 | 3;
  const newStrike: Strike = { failedGuess: failedInput, strikeNumber };
  const strikes = [...round.strikes, newStrike];
  const nextRound: Round = { ...round, strikes };
  return { ...nextRound, isComplete: isRoundComplete(nextRound) };
}

// ─── getScore ─────────────────────────────────────────────────────────────────

/**
 * Returns the sum of scores for all revealed clusters.
 * Unrevealed clusters are not counted.
 */
export function getScore(round: Round): number {
  return round.revealedClusters.reduce((sum, cluster) => sum + cluster.score, 0);
}
