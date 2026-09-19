import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { BreachRecord, ExposureCategory } from "../types";

const HIBP_BASE = "https://haveibeenpwned.com/api/v3";

/**
 * Maps HIBP's free-text "DataClasses" (there are dozens of specific
 * strings like "Email addresses", "Partial credit card data", etc.)
 * into our fixed ExposureCategory set. Anything not recognized falls
 * through to "other" rather than being silently dropped — we never
 * want to under-report what was actually exposed.
 */
const DATA_CLASS_MAP: Record<string, ExposureCategory> = {
  "email addresses": "email",
  "passwords": "password",
  "password hints": "password",
  "phone numbers": "phone",
  "names": "name",
  "physical addresses": "location",
  "geographic locations": "location",
  "usernames": "username",
  "ip addresses": "ip-address",
};

export function mapDataClasses(dataClasses: string[]): ExposureCategory[] {
  const mapped = dataClasses.map((entry) => DATA_CLASS_MAP[entry.toLowerCase()] ?? "other");
  return Array.from(new Set(mapped));
}

/** A breach is flagged "sensitive" by HIBP itself when it covers especially personal categories (e.g. health, sexuality). We surface that flag rather than re-deriving our own judgment call. */
interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  DataClasses: string[];
  IsSensitive: boolean;
  IsVerified: boolean;
}

export type BreachLookupResult =
  | { ok: true; breaches: BreachRecord[] }
  | { ok: false; status: "not-configured" | "rate-limited" | "unavailable" | "timeout"; message: string };

/**
 * Looks up an email against HIBP's breach database. HIBP returns 404
 * for "no breaches found" (not an empty array), which this treats as
 * a genuine, valid result — not an error.
 */
export async function lookupBreaches(email: string): Promise<BreachLookupResult> {
  if (!env.HIBP_API_KEY) {
    return {
      ok: false,
      status: "not-configured",
      message: "The breach-checking service isn't configured yet. Please try again later.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": env.HIBP_API_KEY,
          "user-agent": "CyberSentinel-Data-Breach-Checker",
        },
      },
      10_000
    );

    if (response.status === 404) {
      return { ok: true, breaches: [] };
    }

    if (response.status === 429) {
      return {
        ok: false,
        status: "rate-limited",
        message: "Too many breach checks right now. Please wait a moment and try again.",
      };
    }

    if (!response.ok) {
      throw new Error(`HIBP responded with ${response.status}`);
    }

    const data = (await response.json()) as HibpBreach[];

    const breaches: BreachRecord[] = data.map((breach) => ({
      name: breach.Name,
      title: breach.Title,
      domain: breach.Domain || "Unknown",
      breachDate: breach.BreachDate,
      addedDate: breach.AddedDate,
      exposedCategories: mapDataClasses(breach.DataClasses),
      isPasswordExposed: breach.DataClasses.some((c) => c.toLowerCase().includes("password")),
      isSensitive: breach.IsSensitive,
    }));

    return { ok: true, breaches };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    logger.error("HIBP breach lookup failed", { error: String(error) });
    return {
      ok: false,
      status: isTimeout ? "timeout" : "unavailable",
      message: isTimeout
        ? "The breach-checking service took too long to respond. Please try again."
        : "The breach-checking service is temporarily unavailable. Please try again shortly.",
    };
  }
}
