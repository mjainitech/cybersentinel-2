/**
 * Validates and normalizes a URL typed by the user.
 * Accepts input with or without a protocol (e.g. "example.com" or
 * "https://example.com") and returns a friendly error message when
 * the input isn't something a scanner could reasonably check.
 */

export type UrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

const HOSTNAME_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export function validateUrl(rawInput: string): UrlValidationResult {
  const input = rawInput.trim();

  if (!input) {
    return { valid: false, error: "Please enter a URL to scan." };
  }

  // Let people type "example.com" without worrying about the protocol.
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      valid: false,
      error: "That doesn't look like a valid URL. Try something like example.com",
    };
  }

  if (!HOSTNAME_PATTERN.test(parsed.hostname)) {
    return {
      valid: false,
      error: "That doesn't look like a valid domain. Try something like example.com",
    };
  }

  return { valid: true, url: parsed.toString() };
}
