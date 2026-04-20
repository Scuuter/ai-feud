/**
 * Pure enrichment library — no I/O, no LLM calls.
 * All functions are deterministic and fully unit-testable.
 *
 * Used by scripts/data-generation/enrichment.ts (the orchestrator).
 */
import type {
  AnswerCluster,
  WildCard,
  SurveyResult,
  FlavorQuote,
  RawSurveyData,
} from '../types.js';
import type { SelectedPersona } from './prompts/quotes-prompts.js';

// ─── selectPersonasForCluster ────────────────────────────────────────────────

/**
 * Returns up to `count` random personas from `cluster.personaIds`, enriched
 * with personaName, toneOfVoice, and rawAnswer from rawData.
 *
 * Edge cases:
 * - personaIds not found in rawData are silently excluded.
 * - If fewer than `count` valid personas exist, returns all available.
 */
export function selectPersonasForCluster(
  cluster: AnswerCluster,
  rawData: RawSurveyData,
  count: number
): SelectedPersona[] {
  const rawMap = new Map(rawData.rawResponses.map(r => [r.personaId, r]));

  // Resolve all personaIds that exist in rawData
  const resolved: SelectedPersona[] = [];
  for (const id of cluster.personaIds) {
    const raw = rawMap.get(id);
    if (raw) {
      resolved.push({
        personaId: raw.personaId,
        personaName: raw.personaName,
        toneOfVoice: raw.toneOfVoice,
        rawAnswer: raw.text,
      });
    }
  }

  if (resolved.length <= count) {
    return resolved;
  }

  // Fisher-Yates shuffle then take first `count`
  const shuffled = [...resolved];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ─── selectPersonaForWildcard ────────────────────────────────────────────────

/**
 * Single lookup by personaId in rawData.
 * If not found, returns a safe fallback object.
 */
export function selectPersonaForWildcard(
  wildcard: WildCard,
  rawData: RawSurveyData
): SelectedPersona {
  const raw = rawData.rawResponses.find(r => r.personaId === wildcard.personaId);
  if (raw) {
    return {
      personaId: raw.personaId,
      personaName: raw.personaName,
      toneOfVoice: raw.toneOfVoice,
      rawAnswer: raw.text,
    };
  }
  // Fallback: use personaId as name, empty strings for missing fields
  return {
    personaId: wildcard.personaId,
    personaName: wildcard.personaId,
    toneOfVoice: '',
    rawAnswer: '',
  };
}

// ─── validateSynonyms ────────────────────────────────────────────────────────

/**
 * Validates and sanitises raw LLM synonym output.
 * - Throws if input.synonyms is not an array.
 * - Filters empty/whitespace-only strings.
 * - Deduplicates.
 * - Caps at 5.
 */
export function validateSynonyms(raw: unknown): string[] {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as Record<string, unknown>)['synonyms'])
  ) {
    throw new Error('validateSynonyms: expected { synonyms: string[] }');
  }

  const synonyms = (raw as Record<string, unknown>)['synonyms'] as unknown[];
  const filtered = synonyms
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map(s => s.trim());

  const deduped = [...new Set(filtered)];
  return deduped.slice(0, 5);
}

// ─── validateClusterQuotes ───────────────────────────────────────────────────

/**
 * Validates raw LLM cluster quote output.
 * Throws if any expected personaId is missing from the quotes array.
 */
export function validateClusterQuotes(
  raw: unknown,
  expectedPersonaIds: string[]
): FlavorQuote[] {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as Record<string, unknown>)['quotes'])
  ) {
    throw new Error('validateClusterQuotes: expected { quotes: Array<...> }');
  }

  const quotes = (raw as Record<string, unknown>)['quotes'] as unknown[];

  // Build a set of returned personaIds for fast lookup
  const returnedIds = new Set(
    quotes
      .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
      .map(q => q['personaId'])
  );

  const missingIds = expectedPersonaIds.filter(id => !returnedIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(
      `validateClusterQuotes: missing quotes for personaIds: ${missingIds.join(', ')}`
    );
  }

  // Map to FlavorQuote[]
  return quotes
    .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
    .filter(q => typeof q['personaName'] === 'string' && typeof q['text'] === 'string')
    .map(q => ({
      personaName: q['personaName'] as string,
      text: q['text'] as string,
    }));
}

// ─── validateWildcardQuote ───────────────────────────────────────────────────

/**
 * Validates raw LLM wildcard quote output.
 * Throws if flavorQuote or its text field is missing.
 */
export function validateWildcardQuote(raw: unknown): FlavorQuote {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('validateWildcardQuote: expected an object');
  }

  const obj = raw as Record<string, unknown>;
  const fq = obj['flavorQuote'];

  if (typeof fq !== 'object' || fq === null) {
    throw new Error('validateWildcardQuote: missing flavorQuote field');
  }

  const quote = fq as Record<string, unknown>;

  if (typeof quote['text'] !== 'string' || quote['text'].trim().length === 0) {
    throw new Error('validateWildcardQuote: flavorQuote.text is missing or empty');
  }

  if (typeof quote['personaName'] !== 'string') {
    throw new Error('validateWildcardQuote: flavorQuote.personaName is missing');
  }

  return {
    personaName: quote['personaName'],
    text: quote['text'],
  };
}

// ─── assembleFinalResult ─────────────────────────────────────────────────────

/**
 * Pure assembly: merges enriched clusters + wildcards into the final SurveyResult.
 * Always sets enrichedAt to the current ISO timestamp.
 * Preserves id, topicText, demographicName, and tags from the original.
 */
export function assembleFinalResult(
  original: SurveyResult,
  enrichedClusters: AnswerCluster[],
  enrichedWildcards: WildCard[]
): SurveyResult {
  return {
    id: original.id,
    topicText: original.topicText,
    demographicName: original.demographicName,
    clusters: enrichedClusters,
    wildcards: enrichedWildcards,
    ...(original.tags !== undefined && { tags: original.tags }),
    enrichedAt: new Date().toISOString(),
  };
}
