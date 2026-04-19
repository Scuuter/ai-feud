import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadJson } from '../../../scripts/data-generation/utils/fs.js';
import type { Persona, Topic, RawSurveyData, RawResponse, FlavorQuote, AnswerCluster, WildCard, SurveyResultDocument, LLMResponse, QuoteResponse, ClusterResult } from '../../../scripts/data-generation/types.js';

const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'fixtures');

describe('Contract: Persona', () => {
  it('should parse valid Persona from fixture', async () => {
    const personas = await loadJson<Persona[]>(path.join(FIXTURES_DIR, 'persona-v1.json'));
    expect(personas).toHaveLength(2);
    expect(personas[0]).toMatchObject({
      id: 'persona-001',
      name: 'Angry Chef',
      description: expect.stringContaining('chef'),
      toneOfVoice: 'Aggressive',
      demographics: expect.arrayContaining(['chef']),
    });
  });
});

describe('Contract: Topic', () => {
  it('should parse valid Topic from fixture', async () => {
    const topics = await loadJson<Topic[]>(path.join(FIXTURES_DIR, 'topic-v1.json'));
    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({
      id: 'test-topic',
      'prompt-ai': "What's the best food?",
      'text-ui': "What's the best food?",
      score: 100,
      tags: expect.arrayContaining(['food']),
    });
  });
});
