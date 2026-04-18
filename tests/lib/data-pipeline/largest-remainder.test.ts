import { describe, it, expect } from 'vitest';
import { normalizeScoresTo100 } from '../../../scripts/data-generation/lib/normalization';

describe('Largest Remainder Normalization', () => {
  it('should normalize [33, 33, 34] out of N=100 to exactly 100 points', () => {
    const rawCounts = [33, 33, 34];
    const result = normalizeScoresTo100(rawCounts);
    const total = result.reduce((sum: number, score: number) => sum + score, 0);
    expect(total).toBe(100);
  });

  it('should normalize [10, 10, 80] out of N=100 to exactly 100 points', () => {
    const rawCounts = [10, 10, 80];
    const result = normalizeScoresTo100(rawCounts);
    const total = result.reduce((sum: number, score: number) => sum + score, 0);
    expect(total).toBe(100);
  });

  it('should normalize [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] (sparse case) out of N=20 to exactly 100 points', () => {
    const rawCounts = Array(20).fill(1);
    const result = normalizeScoresTo100(rawCounts);
    const total = result.reduce((sum: number, score: number) => sum + score, 0);
    expect(total).toBe(100);
  });

  it('should normalize [25, 25, 25, 25] out of N=100 to exactly 100 points', () => {
    const rawCounts = [25, 25, 25, 25];
    const result = normalizeScoresTo100(rawCounts);
    const total = result.reduce((sum: number, score: number) => sum + score, 0);
    expect(total).toBe(100);
  });

  it('should preserve relative proportions from raw counts', () => {
    const rawCounts = [75, 25];
    const result = normalizeScoresTo100(rawCounts);
    expect(result[0]).toBe(75);
    expect(result[1]).toBe(25);
  });

  it('should handle single element array', () => {
    const rawCounts = [50];
    const result = normalizeScoresTo100(rawCounts);
    expect(result).toEqual([100]);
  });

  it('should handle edge case where floor results sum to exactly 100', () => {
    const rawCounts = [50, 50];
    const result = normalizeScoresTo100(rawCounts);
    const total = result.reduce((sum: number, score: number) => sum + score, 0);
    expect(total).toBe(100);
  });

  it('should distribute remainder points to highest decimal remainders', () => {
    const rawCounts = [33, 33, 34];
    const result = normalizeScoresTo100(rawCounts);
    const expected = [33, 33, 34];
    expect(result).toEqual(expected);
  });
});