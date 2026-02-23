/**
 * HTML → raw markdown conversion using Turndown.
 * Uses the browser's native DOMParser for zero-dependency HTML parsing.
 */

import TurndownService from 'turndown';

// ── HTML detection ───────────────────────────────────────────────────────────

const HTML_INDICATORS = [
  /<!DOCTYPE\s+html/i,
  /^<html[\s>]/i,
];

const HTML_STRUCTURAL_TAGS = [
  /<div[\s>]/i,
  /<p[\s>]/i,
  /<h[1-6][\s>]/i,
  /<ul[\s>]/i,
  /<ol[\s>]/i,
  /<li[\s>]/i,
  /<table[\s>]/i,
  /<section[\s>]/i,
  /<article[\s>]/i,
  /<a\s+href/i,
  /<br\s*\/?>/i,
  /<img\s/i,
];

/** Returns true if the text looks like HTML rather than plain text. */
export function isHtmlContent(text: string): boolean {
  const trimmed = text.trimStart();
  // Quick check: starts with doctype or <html> tag
  if (HTML_INDICATORS.some((re) => re.test(trimmed.slice(0, 200)))) {
    return true;
  }
  // Count distinct structural tags — 3+ means HTML
  let tagCount = 0;
  for (const re of HTML_STRUCTURAL_TAGS) {
    if (re.test(text)) tagCount++;
    if (tagCount >= 3) return true;
  }
  return false;
}

// ── Turndown instance ────────────────────────────────────────────────────────

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Strip noise tags entirely
turndown.remove(['script', 'style', 'noscript']);

/** Convert an HTML string (full page or fragment) to markdown. */
export function convertHtmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
