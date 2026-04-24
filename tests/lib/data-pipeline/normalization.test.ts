import { describe, it, expect } from 'vitest';
import { normalizeScoresTo100 } from '@scripts/data-generation/lib/normalization';

describe('normalizeScoresTo100', () => {
  it('empty input → empty output', () => {
    expect(normalizeScoresTo100([])).toEqual([]);
  });

  it('all-zero input → all-zero output (no NaN)', () => {
    const result = normalizeScoresTo100([0, 0, 0]);
    expect(result).toEqual([0, 0, 0]);
  });

  it('single element → [100]', () => {
    expect(normalizeScoresTo100([7])).toEqual([100]);
    expect(normalizeScoresTo100([1])).toEqual([100]);
  });

  it('sum always equals 100', () => {
    const cases = [
      [33, 33, 34],
      [10, 10, 80],
      [25, 25, 25, 25],
      [75, 25],
      [50, 50],
      [1, 1, 1],
    ];
    for (const counts of cases) {
      const result = normalizeScoresTo100(counts);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum, `sum for [${counts}]`).toBe(100);
    }
  });

  it('[1,1,1] (of 3) — remainder goes to highest decimal: [34,33,33]', () => {
    // Each is 33.33…; remainder of 1 goes to the first (index 0 has highest decimal tie-break)
    const result = normalizeScoresTo100([1, 1, 1]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
    // Exactly one element should be 34, the other two 33
    const sorted = [...result].sort((a, b) => b - a);
    expect(sorted[0]).toBe(34);
    expect(sorted[1]).toBe(33);
    expect(sorted[2]).toBe(33);
  });

  it('zero-count cluster stays in output (not dropped)', () => {
    const result = normalizeScoresTo100([5, 0, 5]);
    expect(result).toHaveLength(3);
    expect(result[1]).toBe(0);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('large input (100 items, each count=1) still sums to 100', () => {
    const counts = Array(100).fill(1);
    const result = normalizeScoresTo100(counts);
    expect(result).toHaveLength(100);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('preserves relative proportions for clean fractions', () => {
    const result = normalizeScoresTo100([75, 25]);
    expect(result[0]).toBe(75);
    expect(result[1]).toBe(25);
  });
});
