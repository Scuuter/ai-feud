/**
 * TDD: GameState pure function contracts.
 *
 * Tests cover:
 *  - createRound
 *  - applyCorrectGuess
 *  - applyStrike
 *  - checkWinCondition
 *  - checkLossCondition
 *  - isRoundComplete
 *  - getScore
 */
import { describe, it, expect } from 'vitest';
import type { SurveyResult, AnswerCluster, Round } from '@/src/lib/game-logic/types.js';
import {
  createRound,
  applyCorrectGuess,
  applyStrike,
  checkWinCondition,
  checkLossCondition,
  isRoundComplete,
  getScore,
} from '@/src/lib/game-logic/GameState.js';
import surveyFixture from '@/tests/fixtures/survey-result-v1.json';

const SURVEY = surveyFixture as SurveyResult;
const [CLUSTER_A, CLUSTER_B, CLUSTER_C] = SURVEY.clusters;

// ─── createRound ──────────────────────────────────────────────────────────────

describe('createRound', () => {
  it('initializes with empty revealedClusters', () => {
    const round = createRound(SURVEY);
    expect(round.revealedClusters).toEqual([]);
  });

  it('initializes with empty strikes', () => {
    const round = createRound(SURVEY);
    expect(round.strikes).toEqual([]);
  });

  it('isComplete is false on init', () => {
    const round = createRound(SURVEY);
    expect(round.isComplete).toBe(false);
  });

  it('activeSurvey matches the input SurveyResult', () => {
    const round = createRound(SURVEY);
    expect(round.activeSurvey).toBe(SURVEY);
  });
});

// ─── applyCorrectGuess ────────────────────────────────────────────────────────

describe('applyCorrectGuess', () => {
  it('adds the cluster to revealedClusters', () => {
    const round = createRound(SURVEY);
    const next = applyCorrectGuess(round, CLUSTER_A);
    expect(next.revealedClusters).toContain(CLUSTER_A);
  });

  it('does not mutate the original Round', () => {
    const round = createRound(SURVEY);
    const original = [...round.revealedClusters];
    applyCorrectGuess(round, CLUSTER_A);
    expect(round.revealedClusters).toEqual(original);
  });

  it('does not set isComplete when clusters remain', () => {
    const round = createRound(SURVEY);
    const next = applyCorrectGuess(round, CLUSTER_A);
    expect(next.isComplete).toBe(false);
  });

  it('sets isComplete when the last cluster is revealed', () => {
    let round = createRound(SURVEY);
    round = applyCorrectGuess(round, CLUSTER_A);
    round = applyCorrectGuess(round, CLUSTER_B);
    const final = applyCorrectGuess(round, CLUSTER_C);
    expect(final.isComplete).toBe(true);
  });
});

// ─── applyStrike ──────────────────────────────────────────────────────────────

describe('applyStrike', () => {
  it('increments strikes array by one', () => {
    const round = createRound(SURVEY);
    const next = applyStrike(round, 'wrong answer');
    expect(next.strikes).toHaveLength(1);
  });

  it('strikeNumber is 1 on the first strike', () => {
    const round = createRound(SURVEY);
    const next = applyStrike(round, 'wrong');
    expect(next.strikes[0].strikeNumber).toBe(1);
  });

  it('strikeNumber is 2 on the second strike', () => {
    let round = createRound(SURVEY);
    round = applyStrike(round, 'wrong');
    const next = applyStrike(round, 'also wrong');
    expect(next.strikes[1].strikeNumber).toBe(2);
  });

  it('strikeNumber is 3 on the third strike', () => {
    let round = createRound(SURVEY);
    round = applyStrike(round, 'wrong');
    round = applyStrike(round, 'also wrong');
    const next = applyStrike(round, 'still wrong');
    expect(next.strikes[2].strikeNumber).toBe(3);
  });

  it('records the failed guess text', () => {
    const round = createRound(SURVEY);
    const next = applyStrike(round, 'bad guess');
    expect(next.strikes[0].failedGuess).toBe('bad guess');
  });

  it('sets isComplete when the 3rd strike is added', () => {
    let round = createRound(SURVEY);
    round = applyStrike(round, 'wrong');
    round = applyStrike(round, 'also wrong');
    const final = applyStrike(round, 'still wrong');
    expect(final.isComplete).toBe(true);
  });

  it('does not set isComplete at 1 or 2 strikes', () => {
    let round = createRound(SURVEY);
    round = applyStrike(round, 'wrong');
    expect(round.isComplete).toBe(false);
    round = applyStrike(round, 'also wrong');
    expect(round.isComplete).toBe(false);
  });

  it('does not mutate the original Round', () => {
    const round = createRound(SURVEY);
    const originalLength = round.strikes.length;
    applyStrike(round, 'wrong');
    expect(round.strikes).toHaveLength(originalLength);
  });
});

// ─── checkWinCondition ────────────────────────────────────────────────────────

describe('checkWinCondition', () => {
  it('returns false when no clusters are revealed', () => {
    const round = createRound(SURVEY);
    expect(checkWinCondition(round)).toBe(false);
  });

  it('returns false when some clusters are hidden', () => {
    const round = applyCorrectGuess(createRound(SURVEY), CLUSTER_A);
    expect(checkWinCondition(round)).toBe(false);
  });

  it('returns true when all clusters are revealed', () => {
    let round = createRound(SURVEY);
    round = applyCorrectGuess(round, CLUSTER_A);
    round = applyCorrectGuess(round, CLUSTER_B);
    round = applyCorrectGuess(round, CLUSTER_C);
    expect(checkWinCondition(round)).toBe(true);
  });
});

// ─── checkLossCondition ───────────────────────────────────────────────────────

describe('checkLossCondition', () => {
  it('returns false at 0 strikes', () => {
    expect(checkLossCondition(createRound(SURVEY))).toBe(false);
  });

  it('returns false at 1 strike', () => {
    const round = applyStrike(createRound(SURVEY), 'wrong');
    expect(checkLossCondition(round)).toBe(false);
  });

  it('returns false at 2 strikes', () => {
    let round = applyStrike(createRound(SURVEY), 'wrong');
    round = applyStrike(round, 'also wrong');
    expect(checkLossCondition(round)).toBe(false);
  });

  it('returns true at exactly 3 strikes', () => {
    let round = applyStrike(createRound(SURVEY), 'wrong');
    round = applyStrike(round, 'also wrong');
    round = applyStrike(round, 'still wrong');
    expect(checkLossCondition(round)).toBe(true);
  });
});

// ─── isRoundComplete ──────────────────────────────────────────────────────────

describe('isRoundComplete', () => {
  it('returns false for an in-progress round', () => {
    expect(isRoundComplete(createRound(SURVEY))).toBe(false);
  });

  it('returns true when the win condition is met', () => {
    let round = createRound(SURVEY);
    round = applyCorrectGuess(round, CLUSTER_A);
    round = applyCorrectGuess(round, CLUSTER_B);
    round = applyCorrectGuess(round, CLUSTER_C);
    expect(isRoundComplete(round)).toBe(true);
  });

  it('returns true when the loss condition is met (3 strikes)', () => {
    let round = createRound(SURVEY);
    round = applyStrike(round, 'wrong');
    round = applyStrike(round, 'also wrong');
    round = applyStrike(round, 'still wrong');
    expect(isRoundComplete(round)).toBe(true);
  });
});

// ─── getScore ─────────────────────────────────────────────────────────────────

describe('getScore', () => {
  it('returns 0 when no clusters are revealed', () => {
    expect(getScore(createRound(SURVEY))).toBe(0);
  });

  it('returns the score of one revealed cluster', () => {
    const round = applyCorrectGuess(createRound(SURVEY), CLUSTER_A);
    expect(getScore(round)).toBe(CLUSTER_A.score); // 32
  });

  it('sums scores of all revealed clusters', () => {
    let round = createRound(SURVEY);
    round = applyCorrectGuess(round, CLUSTER_A);
    round = applyCorrectGuess(round, CLUSTER_B);
    expect(getScore(round)).toBe(CLUSTER_A.score + CLUSTER_B.score); // 55
  });

  it('does not include score from unrevealed clusters', () => {
    const round = applyCorrectGuess(createRound(SURVEY), CLUSTER_A);
    expect(getScore(round)).not.toBe(CLUSTER_A.score + CLUSTER_B.score + CLUSTER_C.score);
  });
});
