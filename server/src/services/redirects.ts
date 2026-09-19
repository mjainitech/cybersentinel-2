import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

const MAX_HOPS = 5;

/**
 * Follows redirects manually (rather than letting fetch auto-follow)
 * so we can count hops and detect cross-domain jumps — both common
 * signals used to disguise a phishing destination behind a
 * trustworthy-looking link.
 */
export async function getRedirectsCheck(url: string): Promise<ScanCheckResult> {
  const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "redirects",
    title: "Redirects",
  };

  const originalHostname = new URL(url).hostname;
  let current = url;
  let hops = 0;
  let crossedDomain = false;

  try {
    while (hops < MAX_HOPS) {
      const response = await fetchWithTimeout(current, { method: "GET", redirect: "manual" });

      if (response.status < 300 || response.status >= 400) break;

      const location = response.headers.get("location");
      if (!location) break;

      const next = new URL(location, current);
      if (next.hostname !== originalHostname) crossedDomain = true;

      current = next.toString();
      hops++;
    }

    const status = hops === 0 ? "safe" : crossedDomain || hops >= 2 ? "warning" : "safe";
    const value = hops === 0 ? "No redirects detected" : `${hops} redirect${hops === 1 ? "" : "s"} detected`;
    const summary =
      hops === 0
        ? "The page loads directly with no redirects."
        : crossedDomain
        ? "This link redirects to a different domain before loading — worth double-checking the final destination."
        : hops >= 2
        ? "Multiple redirects were detected — common, but worth a second look."
        : "The page redirects once before loading — common, not necessarily a problem.";

    return { ...base, status, value, summary };
  } catch (error) {
    logger.error("Redirect check failed", { url, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "Could not determine redirect behavior for this site.",
    };
  }
}
