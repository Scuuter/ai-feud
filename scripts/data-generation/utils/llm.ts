import { LM_STUDIO_URL, MAX_RETRIES, DEBUG_OUTPUT_DIR } from '../config.js';
import { ensureDir } from './fs.js';
import fs from 'node:fs';
import path from 'node:path';

export interface GenerationStats {
  tokens_per_second: number;
  generation_time: number;
  total_output_tokens: number;
  prompt_tokens?: number;
}

export function extractJsonFromLLMOutput(text: string): string {
  // Strip standard <think> tags
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Strip Gemma <|channel|>thought tags
  cleaned = cleaned.replace(/<\|channel\|>thought[\s\S]*?<channel\|>/g, '');

  // Look for markdown json block first
  const markdownMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // Fallback to finding the first { and last }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  throw new Error('No JSON found in response');
}

interface OpenAIChatChunk {
  id?: string;
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

async function* parseSSEStream(response: Response): AsyncGenerator<OpenAIChatChunk> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        yield JSON.parse(data) as OpenAIChatChunk;
      } catch {
        continue;
      }
    }
  }
}

function dumpDebugFile(
  prompt: string,
  rawResponse: string,
  model: string,
  label: string,
  subDir?: string
): string {
  const targetDir = subDir ? path.join(DEBUG_OUTPUT_DIR, subDir) : DEBUG_OUTPUT_DIR;
  ensureDir(targetDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const filename = timestamp + '_' + safeLabel + '.txt';
  const filepath = path.join(targetDir, filename);

  const separator = '='.repeat(40);
  const content = [
    separator + ' DEBUG DUMP ' + separator,
    'Timestamp: ' + new Date().toISOString(),
    'Model: ' + model,
    'Label: ' + label,
    '',
    separator + ' PROMPT ' + separator,
    prompt,
    '',
    separator + ' RAW RESPONSE ' + separator,
    rawResponse,
  ].join('\n');

  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

export async function callLMStudio<T = unknown>(
  prompt: string,
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 1000,
  debugLabel: string = 'unknown',
  jsonSchema?: Record<string, unknown>,
  debugSubDir?: string
): Promise<{ data: T; stats: GenerationStats }> {
  const startTime = Date.now();

  console.log('\n[API CALL] Model: ' + model + ' | Temp: ' + temperature + ' | MaxTokens: ' + maxTokens + ' | Prompt Length: ' + prompt.length + ' chars');

  const response = await fetch(LM_STUDIO_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      stream: true,
      ...(jsonSchema && { response_format: { type: 'json_schema', json_schema: jsonSchema } })
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`LM Studio error: ${response.status}${body ? ' — ' + body.slice(0, 200) : ''}`);
  }

  let fullContent = '';
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    for await (const chunk of parseSSEStream(response)) {
      if (chunk.choices && chunk.choices.length > 0) {
        const delta = chunk.choices[0].delta;
        if (delta) {
          if (delta.reasoning_content) {
            fullContent += delta.reasoning_content;
          }
          if (delta.content) {
            fullContent += delta.content;
          }
        }
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens || promptTokens;
        completionTokens = chunk.usage.completion_tokens || completionTokens;
      }
    }
  } catch (error) {
    console.error('\n[SSE] Stream error:', error);
  }

  if (!fullContent) {
    console.error('[ERROR] No content accumulated, fullContent is empty');
    if (debugLabel.startsWith('cluster')) {
      const p = dumpDebugFile(prompt, '(empty response)', model, debugLabel, debugSubDir);
      console.error('[DEBUG] Empty response dump: ' + p);
    }
    throw new Error('No content received from stream');
  }

  // Always dump for cluster calls — success or failure — so errors leave a trace
  let debugPath = '';
  if (debugLabel.startsWith('cluster')) {
    debugPath = dumpDebugFile(prompt, fullContent, model, debugLabel, debugSubDir);
    console.log('[DEBUG] Raw response saved: ' + debugPath);
  }
  const generation_time = (Date.now() - startTime) / 1000;
  const stats: GenerationStats = {
    generation_time,
    total_output_tokens: completionTokens,
    prompt_tokens: promptTokens,
    tokens_per_second: completionTokens > 0 ? completionTokens / generation_time : 0
  };

  let extractedJson = '';
  try {
    extractedJson = extractJsonFromLLMOutput(fullContent);
  } catch (err) {
    if (debugPath) {
      console.error('[ERROR] JSON extraction failed. Raw response saved at:');
      console.error('  -> ' + debugPath);
    }
    throw err;
  }

  try {
    return { data: JSON.parse(extractedJson) as T, stats };
  } catch (err) {
    if (debugPath) {
      console.error('[ERROR] JSON.parse failed. Raw response saved at:');
      console.error('  -> ' + debugPath);
    }
    console.error('[ERROR] Extracted JSON preview: ' + extractedJson.slice(0, 300) + '...');
    throw err;
  }
}

/** How long to wait (ms) when the server signals the model is still loading. */
const MODEL_LOADING_BACKOFF_MS = 10_000;

/** Errors that indicate the model is not yet ready — worth waiting longer for. */
function isModelLoadingError(err: Error): boolean {
  return /503|model.*load|loading|not.*ready/i.test(err.message);
}

export async function callLMStudioWithRetry<T = unknown>(
  prompt: string,
  model: string,
  temperature?: number,
  maxTokens?: number,
  retries: number = 3,
  debugLabel: string = 'unknown',
  jsonSchema?: Record<string, unknown>,
  debugSubDir?: string
): Promise<{ data: T; stats: GenerationStats }> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await callLMStudio<T>(prompt, model, temperature, maxTokens, debugLabel, jsonSchema, debugSubDir);
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        const loading = isModelLoadingError(lastError);
        const delayMs = loading ? MODEL_LOADING_BACKOFF_MS : 1000 * (i + 1);
        console.log(`\n[API CALL] Retry ${i + 1}/${retries - 1}${loading ? ' (model loading — waiting ' + delayMs / 1000 + 's)' : ''}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError ?? new Error('Max retries exceeded');
}