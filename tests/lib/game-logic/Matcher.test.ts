/**
 * TDD: Matcher pure function contracts.
 * 
 * Tests cover:
 *  - normalizeInput
 *  - exactMatch (cluster text, cluster synonyms, wildcard rawAnswer)
 *  - fuzzyMatch (per-word strategy, whole-string strategy)
 *  - matchGuess (orchestration, wildcard vs cluster differentiation)
 */
import { describe, it, expect } from 'vitest';
import type { SurveyResult, AnswerCluster, WildCard } from '@/lib/game-logic/types.js';
import {
  normalizeInput,
  exactMatch,
  fuzzyMatch,
  matchGuess,
} from '@/lib/game-logic/Matcher.js';
import surveyFixture from '@tests/fixtures/survey-result-v1.json';

const SURVEY = surveyFixture as SurveyResult;
const CLUSTERS: AnswerCluster[] = SURVEY.clusters;
const WILDCARDS: WildCard[] = SURVEY.wildcards;

// Inline wildcard for targeted synonym tests (wildcards have no synonyms in the fixture)
const WILDCARD_WITH_SYNONYMS: WildCard = {
  personaId: 'grumpy-wizard',
  rawAnswer: 'lost my staff',
  synonyms: ['staff', 'wand', 'lost wand'],
  flavorQuote: { personaName: 'Grumpy Wizard', text: 'My staff, obviously.' },
};

// ─── normalizeInput ───────────────────────────────────────────────────────────

describe('normalizeInput', () => {
  it('lowercases input', () => {
    expect(normalizeInput('LIFE OR DEATH')).toBe('life or death');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeInput('  no way  ')).toBe('no way');
  });

  it('collapses multiple internal spaces to one', () => {
    expect(normalizeInput('just   for   fun')).toBe('just for fun');
  });

  it('handles punctuation without stripping it', () => {
    expect(normalizeInput('Life or Death!')).toBe('life or death!');
  });
});

// ─── exactMatch — cluster text ────────────────────────────────────────────────

describe('exactMatch — cluster text', () => {
  it('matches exact cluster.text (case-insensitive)', () => {
    const result = exactMatch('LIFE OR DEATH!', CLUSTERS, []);
    expect(result.matched).toBe(true);
  });

  it('returns matchType "exact" and isWildCard false on cluster hit', () => {
    const result = exactMatch('Life or Death!', CLUSTERS, []);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('exact');
    expect(result.isWildCard).toBe(false);
  });

  it('target is the matching AnswerCluster', () => {
    const result = exactMatch('Just for Fun!', CLUSTERS, []);
    if (!result.matched || result.isWildCard) throw new Error('Expected a cluster match');
    expect(result.target.text).toBe('Just for Fun!');
  });

  it('returns matched: false when no cluster text matches', () => {
    const result = exactMatch('completely different', CLUSTERS, []);
    expect(result.matched).toBe(false);
  });
});

// ─── exactMatch — cluster synonyms ───────────────────────────────────────────

describe('exactMatch — cluster synonyms', () => {
  it('matches a synonym in cluster synonyms[] (case-insensitive)', () => {
    const result = exactMatch('ESCAPE', CLUSTERS, []); // "escape" is a synonym of "Life or Death!"
    expect(result.matched).toBe(true);
  });

  it('returns matchType "synonym" and isWildCard false on synonym hit', () => {
    const result = exactMatch('survival', CLUSTERS, []);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('synonym');
    expect(result.isWildCard).toBe(false);
  });

  it('target is the cluster that owns the synonym', () => {
    const result = exactMatch('yolo', CLUSTERS, []); // synonym of "Just for Fun!"
    if (!result.matched || result.isWildCard) throw new Error('Expected a cluster match');
    expect(result.target.text).toBe('Just for Fun!');
  });
});

// ─── exactMatch — wildcard rawAnswer ─────────────────────────────────────────

describe('exactMatch — wildcard rawAnswer', () => {
  it('matches wildcard.rawAnswer exactly (case-insensitive)', () => {
    const result = exactMatch(
      'because the vacuum cleaner turned on',
      [],
      WILDCARDS,
    );
    expect(result.matched).toBe(true);
  });

  it('returns matchType "exact" and isWildCard true on wildcard hit', () => {
    const result = exactMatch(
      'because the vacuum cleaner turned on',
      [],
      WILDCARDS,
    );
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('exact');
    expect(result.isWildCard).toBe(true);
  });

  it('target is the matching WildCard object', () => {
    const result = exactMatch('because the vacuum cleaner turned on', [], WILDCARDS);
    if (!result.matched || !result.isWildCard) throw new Error('Expected a wildcard match');
    expect(result.target.personaId).toBe('anxious-house-cat');
  });

  it('matches wildcard synonyms (case-insensitive)', () => {
    const result = exactMatch('HOOVER', [], WILDCARDS); // "hoover" is a synonym of anxious-house-cat wildcard
    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.isWildCard).toBe(true);
  });

  it('matches wildcard synonyms with correct matchType', () => {
    const result = exactMatch('vacuum', [], WILDCARDS);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('synonym');
    expect(result.isWildCard).toBe(true);
  });
});

// ─── fuzzyMatch — per-word strategy (default) ─────────────────────────────────

describe('fuzzyMatch — per-word strategy (default)', () => {
  it('matches a 1-char typo in a single word ("Leif or Death!" → "Life or Death!")', () => {
    // "leif" vs "life" → distance 1; "or" exact; "death!" exact — 3/3 = 100% matched
    const result = fuzzyMatch('Leif or Death!', CLUSTERS, []);
    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('fuzzy');
    expect(result.isWildCard).toBe(false);
  });

  it('matches when a short word is missing but ≥66% of input words match', () => {
    // "life death" → "life" exact + "death" exact vs "life or death!" = 2/2 words → 100%
    const result = fuzzyMatch('life death', CLUSTERS, []);
    expect(result.matched).toBe(true);
  });

  it('matches a wildcard rawAnswer with a typo → isWildCard: true', () => {
    // "lost my staf" → "lost my staff" — "staf" vs "staff" distance 1
    const result = fuzzyMatch('lost my staf', [], [WILDCARD_WITH_SYNONYMS]);
    expect(result.matched).toBe(true);
    if (!result.matched || !result.isWildCard) throw new Error('Expected a wildcard match');
    expect(result.target.personaId).toBe('grumpy-wizard');
  });

  it('returns matched: false when fewer than 66% of words are within threshold', () => {
    // "xyz abc" vs "Life or Death!" — no words are close
    const result = fuzzyMatch('xyz abc', CLUSTERS, []);
    expect(result.matched).toBe(false);
  });

  it('does NOT fuzzy-match words of length < 4 (short-word guard)', () => {
    // "lif" (length 3) vs "Life or Death!" — "lif" is too short for fuzzy, so whole thing misses
    // unless other words save it. Test specifically: single short word vs all clusters
    const result = fuzzyMatch('noo', CLUSTERS, []); // "noo" length 3 — too short for fuzzy
    expect(result.matched).toBe(false);
  });

  it('returns matchType "fuzzy"', () => {
    const result = fuzzyMatch('No Waay!', CLUSTERS, []);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('fuzzy');
  });

  it('returns matched: false when nothing is within threshold', () => {
    const result = fuzzyMatch('completely unrelated answer', CLUSTERS, []);
    expect(result.matched).toBe(false);
  });

  it('correctly identifies isWildCard: false for cluster fuzzy matches', () => {
    const result = fuzzyMatch('Life or Daeth!', CLUSTERS, WILDCARDS);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.isWildCard).toBe(false);
  });
});

// ─── fuzzyMatch — whole-string strategy ───────────────────────────────────────

describe('fuzzyMatch — whole-string strategy', () => {
  it('matches when whole-string Levenshtein distance ≤ threshold', () => {
    // "No Woy!" vs "No Way!" → distance = 1 ≤ 2
    const result = fuzzyMatch('No Woy!', CLUSTERS, [], { fuzzyStrategy: 'whole-string', threshold: 2 });
    expect(result.matched).toBe(true);
  });

  it('misses a phrase that per-word catches but whole-string distance exceeds threshold', () => {
    // "life death" vs "Life or Death!" — whole-string distance is "life death" vs "life or death!" = 4 > 2
    const perWord = fuzzyMatch('life death', CLUSTERS, [], { fuzzyStrategy: 'per-word' });
    const wholeString = fuzzyMatch('life death', CLUSTERS, [], { fuzzyStrategy: 'whole-string', threshold: 2 });
    expect(perWord.matched).toBe(true);
    expect(wholeString.matched).toBe(false);
  });

  it('strategy is selectable via MatcherConfig.fuzzyStrategy', () => {
    // Running same input with both strategies gives different results (confirms config is wired)
    const r1 = fuzzyMatch('life death', CLUSTERS, [], { fuzzyStrategy: 'per-word' });
    const r2 = fuzzyMatch('life death', CLUSTERS, [], { fuzzyStrategy: 'whole-string' });
    expect(r1.matched).not.toBe(r2.matched);
  });
});

// ─── matchGuess — orchestration ──────────────────────────────────────────────

describe('matchGuess — orchestration', () => {
  it('returns an exact match without running fuzzy', () => {
    const result = matchGuess(
      { rawInput: 'No Way!', submittedAt: Date.now() },
      CLUSTERS,
      [],
    );
    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('exact');
  });

  it('falls back to fuzzy when exact fails', () => {
    const result = matchGuess(
      { rawInput: 'No Waay!', submittedAt: Date.now() },
      CLUSTERS,
      [],
    );
    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error('Expected a match');
    expect(result.matchType).toBe('fuzzy');
  });

  it('returns matched: false when both exact and fuzzy fail', () => {
    const result = matchGuess(
      { rawInput: 'zzzzz unrelated', submittedAt: Date.now() },
      CLUSTERS,
      [],
    );
    expect(result.matched).toBe(false);
  });

  it('returns isWildCard: false for a cluster match', () => {
    const result = matchGuess(
      { rawInput: 'Life or Death!', submittedAt: Date.now() },
      CLUSTERS,
      WILDCARDS,
    );
    if (!result.matched) throw new Error('Expected a match');
    expect(result.isWildCard).toBe(false);
  });

  it('returns isWildCard: true for a wildcard match', () => {
    const result = matchGuess(
      { rawInput: 'because the vacuum cleaner turned on', submittedAt: Date.now() },
      [],
      WILDCARDS,
    );
    if (!result.matched) throw new Error('Expected a match');
    expect(result.isWildCard).toBe(true);
  });

  it('prefers cluster over wildcard when both could match', () => {
    // Clusters are checked first — if a cluster matches, we never reach wildcards
    const result = matchGuess(
      { rawInput: 'Life or Death!', submittedAt: Date.now() },
      CLUSTERS,
      WILDCARDS,
    );
    if (!result.matched) throw new Error('Expected a match');
    expect(result.isWildCard).toBe(false);
  });

  it('accepts optional MatcherConfig and applies it', () => {
    const result = matchGuess(
      { rawInput: 'No Woy!', submittedAt: Date.now() },
      CLUSTERS,
      [],
      { threshold: 2, fuzzyStrategy: 'whole-string' },
    );
    expect(result.matched).toBe(true);
  });
});
