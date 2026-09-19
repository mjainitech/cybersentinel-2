/**
 * Converts an ISO 3166-1 alpha-2 country code (e.g. "US", "DE") into
 * its flag emoji. Flag emoji are just two "regional indicator symbol"
 * unicode characters, offset a fixed distance from each ASCII letter
 * — so this is a direct calculation, not a lookup table to maintain.
 */
export function getFlagEmoji(countryCode?: string): string | null {
  if (!countryCode || countryCode.length !== 2) return null;

  const codePoints = [...countryCode.toUpperCase()].map((char) => 127397 + char.charCodeAt(0));

  // Guard against non-letter input producing a garbage glyph.
  if (codePoints.some((point) => point < 127462 || point > 127487)) return null;

  return String.fromCodePoint(...codePoints);
}
