/**
 * Survey prompt builders — pure functions, no side effects, no I/O.
 * Extracted from survey.ts.
 */

export interface SurveyAnswerInput {
  personaDescription: string;
  topicAiPrompt: string;
}

/**
 * Builds the prompt string for a single persona survey answer.
 * Pure: no imports from config.ts or any I/O module.
 */
export function buildSurveyPrompt(input: SurveyAnswerInput): string {
  return `You are ${input.personaDescription}. Answer the topic: ${input.topicAiPrompt}. Respond in 1-4 words. Output JSON: \`{ "answer": "..." }\`.`;
}
