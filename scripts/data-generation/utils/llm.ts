import { LM_STUDIO_URL, MAX_RETRIES } from '../config.js';

export async function callLMStudio<T = unknown>(
  prompt: string,
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<T> {
  const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`LM Studio error: ${response.status}`);
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]) as T;
}

export async function callLMStudioWithRetry<T = unknown>(
  prompt: string,
  model: string,
  temperature?: number,
  maxTokens?: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await callLMStudio<T>(prompt, model, temperature, maxTokens);
    } catch (error) {
      lastError = error as Error;
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError ?? new Error('Max retries exceeded');
}