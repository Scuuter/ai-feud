import { describe, it, expect } from 'vitest';
import { aggregateAssignments } from '../../../scripts/data-generation/lib/aggregation';
import type { AnswerCategory } from '../../../scripts/data-generation/types';

const categories: AnswerCategory[] = [
  { id: 'cat-a', uiText: 'Category A', aiPromptName: 'Bucket A' },
  { id: 'cat-b', uiText: 'Category B', aiPromptName: 'Bucket B' },
];

describe('aggregateAssignments', () => {
  it('valid category IDs → appended to matching cluster personaIds', () => {
    const assignments = [
      { personaId: 'p1', assignedCategory: 'cat-a' },
      { personaId: 'p2', assignedCategory: 'cat-b' },
      { personaId: 'p3', assignedCategory: 'cat-a' },
    ];
    const result = aggregateAssignments(assignments, categories);
    expect(result.clusters.find(c => c.category.id === 'cat-a')!.personaIds).toEqual(['p1', 'p3']);
    expect(result.clusters.find(c => c.category.id === 'cat-b')!.personaIds).toEqual(['p2']);
    expect(result.wildcardPersonaIds).toEqual([]);
  });

  it('"wildcard" assignedCategory → goes to wildcardPersonaIds', () => {
    const assignments = [{ personaId: 'p1', assignedCategory: 'wildcard' }];
    const result = aggregateAssignments(assignments, categories);
    expect(result.wildcardPersonaIds).toContain('p1');
    expect(result.clusters.every(c => c.personaIds.length === 0)).toBe(true);
  });

  it('hallucinated category (not in categories) → falls back to wildcardPersonaIds', () => {
    const assignments = [{ personaId: 'p1', assignedCategory: 'made-up-category' }];
    const result = aggregateAssignments(assignments, categories);
    expect(result.wildcardPersonaIds).toContain('p1');
  });

  it('empty assignments → all clusters have personaIds: [], no wildcards', () => {
    const result = aggregateAssignments([], categories);
    expect(result.wildcardPersonaIds).toEqual([]);
    expect(result.clusters).toHaveLength(2);
    expect(result.clusters.every(c => c.personaIds.length === 0)).toBe(true);
  });

  it('category with zero assignments → present in result with personaIds: []', () => {
    const assignments = [{ personaId: 'p1', assignedCategory: 'cat-a' }];
    const result = aggregateAssignments(assignments, categories);
    const clusterB = result.clusters.find(c => c.category.id === 'cat-b')!;
    expect(clusterB).toBeDefined();
    expect(clusterB.personaIds).toEqual([]);
  });

  it('duplicate personaId in input → both recorded (no dedup)', () => {
    const assignments = [
      { personaId: 'p1', assignedCategory: 'cat-a' },
      { personaId: 'p1', assignedCategory: 'cat-a' },
    ];
    const result = aggregateAssignments(assignments, categories);
    expect(result.clusters.find(c => c.category.id === 'cat-a')!.personaIds).toEqual(['p1', 'p1']);
  });

  it('all clusters from categories are present in output even when no assignments exist for them', () => {
    const threeCategories: AnswerCategory[] = [
      ...categories,
      { id: 'cat-c', uiText: 'Category C', aiPromptName: 'Bucket C' },
    ];
    const result = aggregateAssignments([], threeCategories);
    expect(result.clusters).toHaveLength(3);
    expect(result.clusters.map(c => c.category.id)).toEqual(['cat-a', 'cat-b', 'cat-c']);
  });
});
