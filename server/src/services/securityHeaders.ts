import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

/** Headers commonly recommended for baseline web security hardening. */
const RECOMMENDED_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];

/**
 * Fetches the page directly and inspects which recommended security
 * headers are present. Real check, no third-party API involved.
 */
export async function getSecurityHeadersCheck(url: string): Promise<ScanCheckResult> {
  const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "security-headers",
    title: "Security Headers",
  };

  try {
    const response = await fetchWithTimeout(url, { method: "GET", redirect: "follow" });
    const present = RECOMMENDED_HEADERS.filter((header) => response.headers.has(header));
    const count = present.length;

    const status = count >= 4 ? "safe" : count >= 2 ? "warning" : "danger";
    const summary =
      status === "safe"
        ? "The site sends most or all recommended protective headers."
        : status === "warning"
        ? "A few recommended protective headers are missing."
        : "Most recommended protective headers are missing.";

    return {
      ...base,
      status,
      value: `${count} of ${RECOMMENDED_HEADERS.length} recommended headers present`,
      summary,
    };
  } catch (error) {
    logger.error("Security headers check failed", { url, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "Could not retrieve response headers for this site.",
    };
  }
}
