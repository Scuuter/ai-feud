import { describe, it, expect } from "vitest";
import { extractJsonFromLLMOutput } from "@scripts/data-generation/utils/llm.js";

describe("extractJsonFromLLMOutput", () => {
  it("extracts simple JSON", () => {
    const input = `{"test": true}`;
    expect(extractJsonFromLLMOutput(input)).toBe(`{"test": true}`);
  });

  it("extracts JSON with surrounding text", () => {
    const input = `Here is the JSON: \n{"test": true}\n Hope this helps!`;
    expect(extractJsonFromLLMOutput(input)).toBe(`{"test": true}`);
  });

  it("strips standard <think> tags", () => {
    const input = `
<think>
I need to output a JSON object.
Let's make sure I use { and } braces properly.
</think>
{"test": true}
    `;
    expect(extractJsonFromLLMOutput(input)).toBe(`{"test": true}`);
  });

  it("strips Gemma <|channel|>thought tags", () => {
    const input = `
<|channel|>thought
The user wants JSON.
Here is a curly brace { to start my thoughts.
<channel|>
{"test": true}
    `;
    expect(extractJsonFromLLMOutput(input)).toBe(`{"test": true}`);
  });

  it("extracts JSON from markdown code blocks", () => {
    const input = `
Some text
\`\`\`json
{"test": true, "nested": {"a": 1}}
\`\`\`
Some more text
    `;
    expect(extractJsonFromLLMOutput(input)).toBe(`{"test": true, "nested": {"a": 1}}`);
  });

  it("throws an error if no JSON is found", () => {
    expect(() => extractJsonFromLLMOutput("Just some text")).toThrow("No JSON found");
  });
});
