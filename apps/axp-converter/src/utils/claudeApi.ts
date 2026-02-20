import { LinkPoolEntry } from '../types';

interface FileInput {
  name: string;
  markdown: string;
}

interface FileOutput {
  name: string;
  markdown: string;
}

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are an AXP (Agent Experience Platform) markdown formatter. Your task is to insert hyperlinks from a provided link pool into markdown documents where they are contextually relevant.

Rules you MUST follow:
1. Preserve ALL original wording exactly — do not rewrite, summarize, or remove any content
2. Only ADD [anchor text](url) markdown hyperlink syntax — nothing else changes
3. Insert at most 1 hyperlink per sentence
4. Do not duplicate a URL that already appears in the text
5. Only insert a link where it genuinely adds context — do not force links where they don't fit
6. Use natural anchor text from the surrounding sentence (not raw URLs)
7. Return your response as a valid JSON array ONLY — no explanation, no preamble, no code fences

Response format:
[
  { "name": "filename.txt", "markdown": "...full markdown with links inserted..." },
  ...
]`;

// In dev, Vite proxies /api/claude → https://api.anthropic.com/v1/messages (avoids CORS).
// In prod on Vercel, /axp/api/claude is handled by api/claude.ts serverless function.
const API_URL = import.meta.env.DEV ? '/api/claude' : '/axp/api/claude';

export async function insertLinksWithClaude(
  files: FileInput[],
  linkPool: LinkPoolEntry[]
): Promise<FileOutput[]> {
  if (linkPool.length === 0) {
    return files.map((f) => ({ name: f.name, markdown: f.markdown }));
  }

  const userMessage = JSON.stringify(
    {
      linkPool: linkPool.map((entry) => ({
        url: entry.url,
        context: entry.contextSnippet,
        sourceFile: entry.sourceFile,
      })),
      files: files.map((f) => ({ name: f.name, markdown: f.markdown })),
    },
    null,
    2
  );

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.content?.[0]?.text ?? '';

  // Parse the JSON response — strip code fences if Claude wrapped it
  const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const parsed: FileOutput[] = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error('Claude returned unexpected response format');
  }

  return parsed;
}
