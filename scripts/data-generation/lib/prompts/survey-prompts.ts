/**
 * Survey prompt builders — pure functions, no side effects, no I/O.
 * Extracted from survey.ts.
 */

export interface SurveyAnswerInput {
  personaName: string;
  personaDescription: string;
  topicAiPrompt: string;
  /** Optional demographic world-grounding description. Included in the prompt when provided. */
  demographicContext?: string;
}

/**
 * Builds the prompt string for a single persona survey answer.
 * Pure: no imports from config.ts or any I/O module.
 */
export function buildSurveyPrompt(input: SurveyAnswerInput): string {
  const demographicLine = input.demographicContext
    ? `\nWORLD CONTEXT: ${input.demographicContext}\n`
    : '';
  return `IDENTITY: You are ${input.personaName}, ${input.personaDescription}.${demographicLine}

TOPIC: "${input.topicAiPrompt}"

TASK: Answer the topic above as your character would. Your answer must be 1–4 plain words — a noun, phrase, or concept. Do NOT write a sentence, exclamation, or in-character dialogue. The answer must reflect what your character would think about topic, but phrased neutrally so it can be grouped with similar answers.

CRITICAL RULES:
- Output ONLY the core concept, not your character's voice or emotion.
- No flavor text, no exclamations, no "AARGH", no "I think...", no punctuation beyond the answer itself.
- Bad example: "AARGH, me rum!" → Good example: "Rum"
- Bad example: "Oh definitely coffee, darling." → Good example: "Coffee"

Output ONLY valid JSON: { "answer": "..." }`;
}
