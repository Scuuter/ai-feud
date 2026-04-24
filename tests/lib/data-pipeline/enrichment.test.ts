/**
 * TDD: Pure enrichment logic functions.
 * These tests MUST fail before lib/enrichment.ts is implemented.
 *
 * Tests cover:
 *  - selectPersonasForCluster
 *  - selectPersonaForWildcard
 *  - validateSynonyms
 *  - validateClusterQuotes
 *  - validateWildcardQuote
 *  - assembleFinalResult
 */
import { describe, it, expect } from 'vitest';
import type { AnswerCluster, WildCard, SurveyResult } from '@scripts/data-generation/types.js';
import type { RawSurveyData } from '@scripts/data-generation/types.js';
import {
  selectPersonasForCluster,
  selectPersonaForWildcard,
  validateSynonyms,
  validateClusterQuotes,
  validateWildcardQuote,
  assembleFinalResult,
} from '@scripts/data-generation/lib/enrichment.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_DATA: RawSurveyData = {
  topicId: 'test-topic',
  demographicName: 'demo-v1',
  rawResponses: [
    { personaId: 'p1', personaName: 'Angry Chef', toneOfVoice: 'Aggressive', text: 'my chef knife' },
    { personaId: 'p2', personaName: 'Anxious Teen', toneOfVoice: 'Nervous', text: 'wallet and keys' },
    { personaId: 'p3', personaName: 'Old Fisherman', toneOfVoice: 'Gruff', text: 'fish bait' },
    { personaId: 'p4', personaName: 'Paranoid Spy', toneOfVoice: 'Paranoid', text: 'tracking devices' },
    { personaId: 'p5', personaName: 'Bubbly Influencer', toneOfVoice: 'Enthusiastic', text: 'my ring light' },
  ],
};

const BASE_CLUSTER: AnswerCluster = {
  text: 'Keys & Wallet',
  score: 42,
  personaIds: ['p1', 'p2', 'p3'],
  synonyms: [],
  flavorQuotes: [],
};

const BASE_WILDCARD: WildCard = {
  personaId: 'p4',
  rawAnswer: 'tracking devices',
  synonyms: [],
  flavorQuote: { personaName: 'Unknown', text: 'To be enriched' },
};

const BASE_SURVEY_RESULT: SurveyResult = {
  id: 'result-uuid-001',
  topicText: 'Name something you always check before leaving the house.',
  demographicName: 'demo-v1',
  clusters: [BASE_CLUSTER],
  wildcards: [BASE_WILDCARD],
};

// ─── selectPersonasForCluster ────────────────────────────────────────────────

describe('selectPersonasForCluster', () => {
  it('returns exactly count items when count < available', () => {
    const result = selectPersonasForCluster(BASE_CLUSTER, RAW_DATA, 2);
    expect(result).toHaveLength(2);
  });

  it('returns objects with personaId, personaName, toneOfVoice, rawAnswer', () => {
    const result = selectPersonasForCluster(BASE_CLUSTER, RAW_DATA, 1);
    expect(result[0]).toMatchObject({
      personaId: expect.any(String),
      personaName: expect.any(String),
      toneOfVoice: expect.any(String),
      rawAnswer: expect.any(String),
    });
  });

  it('returns all available without throwing when count > available', () => {
    const cluster: AnswerCluster = { ...BASE_CLUSTER, personaIds: ['p1', 'p2'] };
    const result = selectPersonasForCluster(cluster, RAW_DATA, 10);
    expect(result).toHaveLength(2);
  });

  it('gracefully excludes personaIds not found in rawData', () => {
    const cluster: AnswerCluster = { ...BASE_CLUSTER, personaIds: ['p1', 'MISSING_ID'] };
    const result = selectPersonasForCluster(cluster, RAW_DATA, 2);
    // Only p1 is found, so only 1 result (or 2 with the found ones)
    expect(result.every(p => p.personaId !== 'MISSING_ID')).toBe(true);
  });
});

// ─── selectPersonaForWildcard ────────────────────────────────────────────────

describe('selectPersonaForWildcard', () => {
  it('returns correct personaName, toneOfVoice, and rawAnswer on happy path', () => {
    const result = selectPersonaForWildcard(BASE_WILDCARD, RAW_DATA);
    expect(result).toMatchObject({
      personaId: 'p4',
      personaName: 'Paranoid Spy',
      toneOfVoice: 'Paranoid',
      rawAnswer: 'tracking devices',
    });
  });

  it('returns fallback object when personaId is missing from rawData', () => {
    const wildcard: WildCard = { ...BASE_WILDCARD, personaId: 'MISSING_ID' };
    const result = selectPersonaForWildcard(wildcard, RAW_DATA);
    expect(result).toMatchObject({
      personaId: 'MISSING_ID',
      personaName: 'MISSING_ID',
      toneOfVoice: '',
      rawAnswer: '',
    });
  });
});

// ─── validateSynonyms ────────────────────────────────────────────────────────

describe('validateSynonyms', () => {
  it('throws (or returns []) when input is not an array', () => {
    expect(() => validateSynonyms({ synonyms: 'oops' })).toThrow();
  });

  it('deduplicates synonyms', () => {
    const result = validateSynonyms({ synonyms: ['apple', 'apple', 'banana'] });
    expect(result).toEqual(['apple', 'banana']);
  });

  it('filters empty strings', () => {
    const result = validateSynonyms({ synonyms: ['', 'valid', '   '] });
    expect(result).toEqual(['valid']);
  });

  it('caps at 5 synonyms', () => {
    const result = validateSynonyms({ synonyms: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    expect(result).toHaveLength(5);
  });
});

// ─── validateClusterQuotes ───────────────────────────────────────────────────

describe('validateClusterQuotes', () => {
  it('throws when expected personaIds are missing from the response', () => {
    const raw = {
      quotes: [
        { personaId: 'p1', personaName: 'Angry Chef', text: 'My knife is always sharpened!' },
      ],
    };
    expect(() => validateClusterQuotes(raw, ['p1', 'p2'])).toThrow();
  });

  it('returns FlavorQuote[] on valid input with all expected personaIds', () => {
    const raw = {
      quotes: [
        { personaId: 'p1', personaName: 'Angry Chef', text: 'Keys? I never forget!' },
        { personaId: 'p2', personaName: 'Anxious Teen', text: 'Wallet, obviously.' },
      ],
    };
    const result = validateClusterQuotes(raw, ['p1', 'p2']);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ personaName: 'Angry Chef', text: expect.any(String) });
  });
});

// ─── validateWildcardQuote ───────────────────────────────────────────────────

describe('validateWildcardQuote', () => {
  it('throws when flavorQuote.text is missing', () => {
    expect(() => validateWildcardQuote({ flavorQuote: { personaName: 'Spy' } })).toThrow();
  });

  it('throws when flavorQuote is missing entirely', () => {
    expect(() => validateWildcardQuote({})).toThrow();
  });

  it('returns FlavorQuote on valid input', () => {
    const raw = { flavorQuote: { personaName: 'Paranoid Spy', text: 'Always watching.' } };
    const result = validateWildcardQuote(raw);
    expect(result).toMatchObject({ personaName: 'Paranoid Spy', text: 'Always watching.' });
  });
});

// ─── assembleFinalResult ─────────────────────────────────────────────────────

describe('assembleFinalResult', () => {
  const enrichedCluster: AnswerCluster = {
    ...BASE_CLUSTER,
    synonyms: ['keys and wallet', 'wallet & keys'],
    flavorQuotes: [{ personaName: 'Angry Chef', text: 'My keys are always in my apron!' }],
  };

  const enrichedWildcard: WildCard = {
    ...BASE_WILDCARD,
    flavorQuote: { personaName: 'Paranoid Spy', text: 'They can track me anyway.' },
  };

  it('preserves the original id', () => {
    const result = assembleFinalResult(BASE_SURVEY_RESULT, [enrichedCluster], [enrichedWildcard]);
    expect(result.id).toBe('result-uuid-001');
  });

  it('sets enrichedAt to an ISO timestamp', () => {
    const result = assembleFinalResult(BASE_SURVEY_RESULT, [enrichedCluster], [enrichedWildcard]);
    expect(result.enrichedAt).toBeDefined();
    expect(new Date(result.enrichedAt!).toISOString()).toBe(result.enrichedAt);
  });

  it('preserves cluster order from enrichedClusters input', () => {
    const cluster2: AnswerCluster = {
      text: 'Stove & Lights',
      score: 30,
      personaIds: ['p5'],
      synonyms: ['stove off'],
      flavorQuotes: [],
    };
    const result = assembleFinalResult(BASE_SURVEY_RESULT, [enrichedCluster, cluster2], [enrichedWildcard]);
    expect(result.clusters[0].text).toBe('Keys & Wallet');
    expect(result.clusters[1].text).toBe('Stove & Lights');
  });

  it('returns enriched wildcards', () => {
    const result = assembleFinalResult(BASE_SURVEY_RESULT, [enrichedCluster], [enrichedWildcard]);
    expect(result.wildcards[0].flavorQuote.text).toBe('They can track me anyway.');
  });
});
