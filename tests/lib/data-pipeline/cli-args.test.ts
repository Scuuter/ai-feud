import { describe, it, expect } from 'vitest';
import { parseCliArgs } from '@scripts/data-generation/utils/cli';

describe('parseCliArgs', () => {
  it('no args → defaults: runMissing false, all others undefined', () => {
    expect(parseCliArgs([])).toEqual({
      runMissing: false,
      limit: undefined,
      topicId: undefined,
      rawCategories: undefined,
    });
  });

  it('--limit 5 → limit: 5', () => {
    const result = parseCliArgs(['--limit', '5']);
    expect(result.limit).toBe(5);
  });

  it('--topic my-topic-id → topicId: "my-topic-id"', () => {
    const result = parseCliArgs(['--topic', 'my-topic-id']);
    expect(result.topicId).toBe('my-topic-id');
  });

  it('--missing → runMissing: true', () => {
    const result = parseCliArgs(['--missing']);
    expect(result.runMissing).toBe(true);
  });

  it('--categories JSON string → rawCategories populated', () => {
    const json = '[{"id":"cat-a"}]';
    const result = parseCliArgs(['--categories', json]);
    expect(result.rawCategories).toBe(json);
  });

  it('--limit abc → NaN (parseInt behaviour, not throwing)', () => {
    const result = parseCliArgs(['--limit', 'abc']);
    expect(Number.isNaN(result.limit)).toBe(true);
  });

  it('all flags together → all fields populated', () => {
    const json = '[]';
    const result = parseCliArgs([
      '--limit', '3',
      '--topic', 'some-topic',
      '--missing',
      '--categories', json,
    ]);
    expect(result).toEqual({
      limit: 3,
      topicId: 'some-topic',
      runMissing: true,
      rawCategories: json,
    });
  });

  it('--limit with no following value → NaN', () => {
    // argv ends after the flag, index+1 is undefined → parseInt(undefined) → NaN
    const result = parseCliArgs(['--limit']);
    expect(Number.isNaN(result.limit)).toBe(true);
  });
});
