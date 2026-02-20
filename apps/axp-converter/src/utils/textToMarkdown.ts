/**
 * Heuristic plain-text → raw markdown conversion.
 * Preserves all original wording. Only adds markdown structural syntax.
 */

function isTitleCase(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length === 0 || words.length > 10) return false;
  return words.every((w) => /^[A-Z][a-z]*$/.test(w) || /^[A-Z]+$/.test(w) || w.length <= 3);
}

function isAllCaps(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length > 0 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

function isHeadingCandidate(line: string, nextLine: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 100) return false;
  // Already a markdown heading
  if (trimmed.startsWith('#')) return false;
  // All caps
  if (isAllCaps(trimmed)) return true;
  // Title case with short length
  if (isTitleCase(trimmed) && trimmed.length <= 60) return true;
  // Ends with colon and next line is blank or indented content
  if (trimmed.endsWith(':') && (!nextLine || nextLine.trim() === '')) return true;
  return false;
}

function isBulletLine(line: string): boolean {
  return /^(\s*)([-•*–])\s+/.test(line);
}

function isNumberedLine(line: string): boolean {
  return /^(\s*)(\d+[.)]\s+|\([a-z\d]\)\s+|[a-z][.)]\s+)/.test(line);
}

function normalizeBullet(line: string): string {
  return line.replace(/^(\s*)([-•*–])\s+/, '$1- ');
}

function normalizeNumbered(line: string): string {
  // Normalize to "1. " style but preserve the actual number
  return line.replace(/^(\s*)(\d+)[.)]\s+/, '$11. ')
    .replace(/^(\s*)\([a-z\d]\)\s+/, '$11. ')
    .replace(/^(\s*)[a-z][.)]\s+/, '$11. ');
}

function isBlank(line: string): boolean {
  return line.trim() === '';
}

export function convertToMarkdown(rawText: string): string {
  const lines = rawText.split('\n');
  const output: string[] = [];
  let firstHeadingDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextLine = lines[i + 1] ?? '';

    // Preserve blank lines
    if (isBlank(line)) {
      output.push('');
      continue;
    }

    // Already a markdown heading — preserve as-is
    if (trimmed.startsWith('#')) {
      output.push(line);
      if (!firstHeadingDone) firstHeadingDone = true;
      continue;
    }

    // Already a markdown list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      output.push(line);
      continue;
    }

    // Heading detection
    if (isHeadingCandidate(trimmed, nextLine)) {
      const cleanedHeading = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
      if (!firstHeadingDone) {
        output.push(`# ${cleanedHeading}`);
        firstHeadingDone = true;
      } else {
        output.push(`## ${cleanedHeading}`);
      }
      continue;
    }

    // Bullet list normalization
    if (isBulletLine(line)) {
      output.push(normalizeBullet(line));
      continue;
    }

    // Numbered list normalization
    if (isNumberedLine(line)) {
      output.push(normalizeNumbered(line));
      continue;
    }

    // Code block: line indented 4+ spaces (only if not inside a list)
    if (line.startsWith('    ') && !isBulletLine(line) && !isNumberedLine(line)) {
      output.push(line);
      continue;
    }

    // Default: preserve line as-is (paragraph text)
    output.push(line);
  }

  // Clean up: collapse 3+ consecutive blank lines to 2
  const cleaned: string[] = [];
  let blankCount = 0;
  for (const line of output) {
    if (isBlank(line)) {
      blankCount++;
      if (blankCount <= 1) cleaned.push(line);
    } else {
      blankCount = 0;
      cleaned.push(line);
    }
  }

  return cleaned.join('\n').trim();
}
