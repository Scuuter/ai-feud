import { describe, it, expect } from 'vitest';
import { extractJsonFromLLMOutput } from '@scripts/data-generation/utils/llm';

describe('extractJsonFromLLMOutput', () => {
  it('clean JSON object → returned as-is', () => {
    const input = '{"foo": "bar", "n": 42}';
    expect(extractJsonFromLLMOutput(input)).toBe(input);
  });

  it('JSON inside ```json markdown block → extracts inner content', () => {
    const input = '```json\n{"a": 1}\n```';
    expect(extractJsonFromLLMOutput(input)).toBe('{"a": 1}');
  });

  it('JSON after <think>…</think> → strips tags, returns JSON', () => {
    const input = `<think>\nI should output JSON here. Let me think { about } it.\n</think>\n{"result": true}`;
    expect(extractJsonFromLLMOutput(input)).toBe('{"result": true}');
  });

  it('JSON after Gemma <|channel|>thought…<channel|> tags → strips, returns JSON', () => {
    const input = `<|channel|>thought\nThe user wants { some } JSON.\n<channel|>\n{"result": true}`;
    expect(extractJsonFromLLMOutput(input)).toBe('{"result": true}');
  });

  it('reasoning block + markdown wrapper → handles both', () => {
    const input = `<think>\nLet me think.\n</think>\n\`\`\`json\n{"combined": true}\n\`\`\``;
    expect(extractJsonFromLLMOutput(input)).toBe('{"combined": true}');
  });

  it('no JSON found → throws "No JSON found in response"', () => {
    expect(() => extractJsonFromLLMOutput('Just plain text with no braces')).toThrow(
      'No JSON found in response'
    );
  });
});
