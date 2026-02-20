import { LinkPoolEntry } from '../types';

const URL_REGEX = /https?:\/\/[^\s\)"'<>]+/g;

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)\]]+$/, '');
}

function getContextSnippet(text: string, url: string, snippetLength = 80): string {
  const idx = text.indexOf(url);
  if (idx === -1) return '';
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + url.length + 40);
  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet.slice(0, snippetLength + 6); // allow for ellipsis overhead
}

export function extractLinkPool(files: { name: string; rawText: string }[]): LinkPoolEntry[] {
  const seen = new Set<string>();
  const pool: LinkPoolEntry[] = [];

  for (const file of files) {
    const matches = file.rawText.match(URL_REGEX) ?? [];
    for (const rawUrl of matches) {
      const url = stripTrailingPunctuation(rawUrl);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      pool.push({
        url,
        contextSnippet: getContextSnippet(file.rawText, rawUrl),
        sourceFile: file.name,
      });
    }
  }

  return pool;
}
