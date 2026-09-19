/** Hard ceiling so a maliciously huge or repetitive PDF can't blow up memory, storage, or AI token usage. */
const MAX_TEXT_LENGTH = 20_000;

/**
 * Strips control characters and null bytes, collapses excessive
 * whitespace, and caps length. Run on every extracted PDF's text
 * before it's analyzed, stored in a saved report, or sent to the AI
 * review — none of those should ever see raw, unsanitized file content.
 */
export function sanitizeExtractedText(raw: string): string {
  const withoutControlChars = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");
  const collapsedWhitespace = withoutControlChars.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  return collapsedWhitespace.slice(0, MAX_TEXT_LENGTH).trim();
}
