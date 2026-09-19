export type UrlValidationResult = { valid: true; url: string; hostname: string } | { valid: false; error: string };

const HOSTNAME_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Validates and normalizes a URL received from the frontend. The
 * frontend already validates before sending, but the backend never
 * trusts client input — this is the authoritative check.
 */
export function normalizeUrl(rawInput: unknown): UrlValidationResult {
  if (typeof rawInput !== "string" || !rawInput.trim()) {
    return { valid: false, error: "Please provide a URL to scan." };
  }

  const input = rawInput.trim();
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }

  if (!HOSTNAME_PATTERN.test(parsed.hostname)) {
    return { valid: false, error: "That doesn't look like a valid domain." };
  }

  return { valid: true, url: parsed.toString(), hostname: parsed.hostname };
}
