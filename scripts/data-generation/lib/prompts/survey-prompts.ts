/**
 * Survey prompt builders — pure functions, no side effects, no I/O.
 * Extracted from survey.ts.
 */

export interface SurveyAnswerInput {
  personaDescription: string;
  topicAiPrompt: string;
  /** Optional demographic context, e.g. "game-of-thrones". Included in the prompt when provided. */
  demographicContext?: string;
}

/**
 * Builds the prompt string for a single persona survey answer.
 * Pure: no imports from config.ts or any I/O module.
 */
export function buildSurveyPrompt(input: SurveyAnswerInput): string {
  const demographicLine = input.demographicContext
    ? `\nCONTEXT: You are a character from the "${input.demographicContext}" universe.\n`
    : '';
  return `You are ${input.personaDescription}.${demographicLine}

TOPIC: "${input.topicAiPrompt}"

TASK: Answer the topic above as your character would. Your answer must be 1–4 plain words — a noun, phrase, or concept. Do NOT write a sentence, exclamation, or in-character dialogue. The answer must reflect what your character would think, but phrased neutrally so it can be grouped with similar answers.

CRITICAL RULES:
- Output ONLY the core concept, not your character's voice or emotion.
- No flavor text, no exclamations, no "AARGH", no "I think...", no punctuation beyond the answer itself.
- Bad example: "AARGH, me rum!" → Good example: "Rum"
- Bad example: "Oh definitely coffee, darling." → Good example: "Coffee"

Output ONLY valid JSON: { "answer": "..." }`;
}
