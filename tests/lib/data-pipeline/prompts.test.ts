/**
 * Prompt builder shape tests.
 *
 * Tests prove each builder returns a non-empty string with expected content
 * and that no `undefined` values are interpolated.
 */
import { describe, it, expect } from 'vitest';
import { buildSurveyPrompt } from '../../../scripts/data-generation/lib/prompts/survey-prompts.js';
import {
  buildExtractCategoriesPrompt,
  buildAssignChunkPrompt,
} from '../../../scripts/data-generation/lib/prompts/cluster-prompts.js';
import { buildSynonymPrompt } from '../../../scripts/data-generation/lib/prompts/synonyms-prompts.js';
import {
  buildClusterQuotePrompt,
  buildWildcardQuotePrompt,
} from '../../../scripts/data-generation/lib/prompts/quotes-prompts.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasNoUndefined(str: string): boolean {
  return !str.includes('undefined');
}

// ─── buildSurveyPrompt ────────────────────────────────────────────────────────

describe('buildSurveyPrompt', () => {
  const input = {
    personaDescription: 'a paranoid conspiracy theorist',
    topicAiPrompt: 'Name something you always check before leaving the house.',
  };

  it('returns a non-empty string', () => {
    expect(buildSurveyPrompt(input)).toBeTruthy();
  });

  it('contains the persona description', () => {
    expect(buildSurveyPrompt(input)).toContain('paranoid conspiracy theorist');
  });

  it('contains the topic prompt', () => {
    expect(buildSurveyPrompt(input)).toContain('Name something you always check');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildSurveyPrompt(input))).toBe(true);
  });
});

// ─── buildExtractCategoriesPrompt ─────────────────────────────────────────────

describe('buildExtractCategoriesPrompt', () => {
  const input = {
    topicText: 'Name something you always check before leaving the house.',
    answers: ['keys', 'phone', 'wallet'],
    answerCount: 3,
  };

  it('returns a non-empty string', () => {
    expect(buildExtractCategoriesPrompt(input)).toBeTruthy();
  });

  it('contains the topicText', () => {
    expect(buildExtractCategoriesPrompt(input)).toContain(input.topicText);
  });

  it('contains the answerCount', () => {
    expect(buildExtractCategoriesPrompt(input)).toContain('3');
  });

  it('contains the answers list', () => {
    expect(buildExtractCategoriesPrompt(input)).toContain('keys');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildExtractCategoriesPrompt(input))).toBe(true);
  });
});

// ─── buildAssignChunkPrompt ───────────────────────────────────────────────────

describe('buildAssignChunkPrompt', () => {
  const input = {
    topicText: 'Name something you always check before leaving the house.',
    categoriesList: JSON.stringify([{ id: 'keys', description: 'Keys and wallet' }]),
    chunkCount: 2,
    answersList: JSON.stringify([{ id: 'p1', text: 'my keys' }]),
  };

  it('returns a non-empty string', () => {
    expect(buildAssignChunkPrompt(input)).toBeTruthy();
  });

  it('contains the topicText', () => {
    expect(buildAssignChunkPrompt(input)).toContain(input.topicText);
  });

  it('contains the chunkCount', () => {
    expect(buildAssignChunkPrompt(input)).toContain('2');
  });

  it('contains the categoriesList', () => {
    expect(buildAssignChunkPrompt(input)).toContain('keys');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildAssignChunkPrompt(input))).toBe(true);
  });
});

// ─── buildSynonymPrompt ───────────────────────────────────────────────────────

describe('buildSynonymPrompt', () => {
  const baseInput = {
    clusterText: 'Keys & Wallet',
    topicText: 'Name something you always check before leaving the house.',
  };

  it('contains the clusterText', () => {
    expect(buildSynonymPrompt(baseInput)).toContain('Keys & Wallet');
  });

  it('contains the topicText', () => {
    expect(buildSynonymPrompt(baseInput)).toContain('Name something you always check');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildSynonymPrompt(baseInput))).toBe(true);
  });

  describe('sibling clusters block', () => {
    it('omits the sibling block when siblingClusterTexts is not provided', () => {
      const result = buildSynonymPrompt(baseInput);
      expect(result).not.toContain('ALREADY ON THE BOARD');
    });

    it('omits the sibling block when siblingClusterTexts is empty', () => {
      const result = buildSynonymPrompt({ ...baseInput, siblingClusterTexts: [] });
      expect(result).not.toContain('ALREADY ON THE BOARD');
    });

    it('includes the sibling block when siblings are provided', () => {
      const result = buildSynonymPrompt({ ...baseInput, siblingClusterTexts: ['Phone', 'Jacket'] });
      expect(result).toContain('ALREADY ON THE BOARD');
    });

    it('lists each sibling cluster in the block', () => {
      const result = buildSynonymPrompt({ ...baseInput, siblingClusterTexts: ['Phone', 'Jacket'] });
      expect(result).toContain('"Phone"');
      expect(result).toContain('"Jacket"');
    });

    it('does not include the target cluster in the sibling block', () => {
      // Orchestrator filters out the current cluster before passing siblings —
      // this test documents that contract: if it leaks through, the prompt is self-contradictory.
      const result = buildSynonymPrompt({
        ...baseInput,
        siblingClusterTexts: ['Phone', 'Jacket'],
      });
      const siblingSection = result.split('ALREADY ON THE BOARD')[1] ?? '';
      expect(siblingSection).not.toContain('"Keys & Wallet"');
    });

    it('contains no undefined interpolations with siblings', () => {
      const result = buildSynonymPrompt({ ...baseInput, siblingClusterTexts: ['Phone'] });
      expect(hasNoUndefined(result)).toBe(true);
    });
  });
});

// ─── buildClusterQuotePrompt ──────────────────────────────────────────────────

describe('buildClusterQuotePrompt', () => {
  const input = {
    clusterText: 'Keys & Wallet',
    topicText: 'Name something you always check before leaving the house.',
    selectedPersonas: [
      { personaId: 'p1', personaName: 'Angry Chef', toneOfVoice: 'Aggressive', rawAnswer: 'my chef knife' },
      { personaId: 'p2', personaName: 'Anxious Teen', toneOfVoice: 'Nervous', rawAnswer: 'wallet and keys' },
    ],
  };

  it('returns a non-empty string', () => {
    expect(buildClusterQuotePrompt(input)).toBeTruthy();
  });

  it('contains each persona name', () => {
    const result = buildClusterQuotePrompt(input);
    expect(result).toContain('Angry Chef');
    expect(result).toContain('Anxious Teen');
  });

  it('contains each persona rawAnswer', () => {
    const result = buildClusterQuotePrompt(input);
    expect(result).toContain('my chef knife');
    expect(result).toContain('wallet and keys');
  });

  it('contains the clusterText', () => {
    expect(buildClusterQuotePrompt(input)).toContain('Keys & Wallet');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildClusterQuotePrompt(input))).toBe(true);
  });
});

// ─── buildWildcardQuotePrompt ─────────────────────────────────────────────────

describe('buildWildcardQuotePrompt', () => {
  const input = {
    personaId: 'p4',
    personaName: 'Paranoid Spy',
    toneOfVoice: 'Paranoid',
    rawAnswer: 'tracking devices',
    topicText: 'Name something you always check before leaving the house.',
  };

  it('returns a non-empty string', () => {
    expect(buildWildcardQuotePrompt(input)).toBeTruthy();
  });

  it('contains the personaName', () => {
    expect(buildWildcardQuotePrompt(input)).toContain('Paranoid Spy');
  });

  it('contains the rawAnswer', () => {
    expect(buildWildcardQuotePrompt(input)).toContain('tracking devices');
  });

  it('contains the topicText', () => {
    expect(buildWildcardQuotePrompt(input)).toContain('Name something you always check');
  });

  it('contains no undefined interpolations', () => {
    expect(hasNoUndefined(buildWildcardQuotePrompt(input))).toBe(true);
  });
});
