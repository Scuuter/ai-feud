import fs from 'node:fs';
import { callLMStudio } from './utils/llm.js';
import { loadJson, ensureDir } from './utils/fs.js';
import { RawSurveyData } from './types.js';

async function main() {
  const args = process.argv.slice(2);
  const maxTokens = parseInt(args[0] || '10000', 10);
  
  console.log(`\n=== Running Manual Test for Gemma 4 (26B) ===`);
  console.log(`Max Tokens: ${maxTokens}\n`);

  // Load a real sample from the raw output directory
  const rawData = await loadJson<RawSurveyData>('./scripts/output/raw/alien-invasion-hiding.json');
  const answersList = JSON.stringify(
    rawData.rawResponses.map((r) => ({ id: r.personaId, text: r.text })),
    null,
    2
  );

  const prompt = `You are a semantic clustering algorithm. Group the following ${rawData.rawResponses.length} answers into 5-8 clusters.

Analyze the semantic overlap of the answers. Decide which ones fit into broad categories and which ones are too unique and belong in wildcards. Output ONLY valid JSON.

Rules:
1. Each cluster must have >= 3 answers
2. Create a canonical "text" for each cluster
3. Answers with < 3 similar responses go to "wildcardPersonaIds"

Input answers (JSON array of objects with id and text):
${answersList}

Output JSON:
{
  "clusters": [
    {
      "text": "canonical answer",
      "personaIds": ["id1", "id2"]
    }
  ],
  "wildcardPersonaIds": ["id3", "id4"]
}`;

  ensureDir('./scripts/output/manual');
  
  // 1. Save the exact prompt to a text file so you can inspect it or use it in the LM Studio UI
  fs.writeFileSync('./scripts/output/manual/manual-prompt.txt', prompt);
  console.log('✅ Saved exact prompt to: ./scripts/output/manual/manual-prompt.txt');
  console.log('⏳ Generating... (Live output below to check for infinite loops)\n');
  console.log('----------------------------------------------------');

  try {
    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemma-4-26b-a4b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tokenCount = 0;

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
          const chunk = JSON.parse(data);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
            tokenCount++;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }

    console.log('\n----------------------------------------------------');
    console.log(`\n✅ --- RUN SUCCESSFUL ---`);
    console.log(`Streamed approximately ${tokenCount} chunks.\n`);
  } catch (err) {
    console.error('\n❌ --- RUN FAILED ---');
    console.error(err);
    console.log('\n(If this failed with a Segfault, you just reproduced the bug in isolation!)');
  }
}

main().catch(console.error);
