import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

/**
 * Uses WhoisXML API (whoisxmlapi.com) — a common WHOIS-as-a-service
 * provider. Swap the request below for a different provider if
 * needed; the rest of the app only depends on the two ScanCheckResult
 * objects this function returns.
 */
const WHOIS_ENDPOINT = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

function unavailablePair(reason: string): { domainAge: ScanCheckResult; registrar: ScanCheckResult } {
  return {
    domainAge: { id: "domain-age", title: "Domain Age", status: "unknown", value: "Unavailable", summary: reason },
    registrar: { id: "registrar", title: "Domain Registrar", status: "unknown", value: "Unavailable", summary: reason },
  };
}

function formatAge(createdDate: Date): string {
  const now = new Date();
  let years = now.getFullYear() - createdDate.getFullYear();
  let months = now.getMonth() - createdDate.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "Less than a month";
  if (years <= 0) return `${months} month${months === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"}`;
}

export async function getWhoisChecks(
  hostname: string
): Promise<{ domainAge: ScanCheckResult; registrar: ScanCheckResult }> {
  if (!env.WHOIS_API_KEY) {
    return unavailablePair("WHOIS check unavailable — no API key configured on the server.");
  }

  try {
    const response = await fetchWithTimeout(
      `${WHOIS_ENDPOINT}?apiKey=${env.WHOIS_API_KEY}&domainName=${encodeURIComponent(hostname)}&outputFormat=JSON`
    );

    if (!response.ok) {
      throw new Error(`WHOIS provider responded with ${response.status}`);
    }

    const payload = await response.json();
    const record = payload?.WhoisRecord;

    if (!record) {
      return unavailablePair("No WHOIS record was found for this domain.");
    }

    const createdDateRaw = record.createdDate ?? record.registryData?.createdDate;
    const registrarName = record.registrarName ?? record.registryData?.registrarName;

    let domainAge: ScanCheckResult;
    if (createdDateRaw) {
      const createdDate = new Date(createdDateRaw);
      const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      const status = ageInDays < 30 ? "warning" : "safe";
      domainAge = {
        id: "domain-age",
        title: "Domain Age",
        status,
        value: formatAge(createdDate),
        summary:
          status === "warning"
            ? "This domain was registered very recently, which is common among short-lived scam sites."
            : "This domain has an established registration history.",
      };
    } else {
      domainAge = {
        id: "domain-age",
        title: "Domain Age",
        status: "unknown",
        value: "Unavailable",
        summary: "The registration date wasn't available in the WHOIS record.",
      };
    }

    const registrar: ScanCheckResult = registrarName
      ? {
          id: "registrar",
          title: "Domain Registrar",
          status: "safe",
          value: registrarName,
          summary: "No irregularities found in the registration record.",
        }
      : {
          id: "registrar",
          title: "Domain Registrar",
          status: "unknown",
          value: "Unavailable",
          summary: "The registrar name wasn't available in the WHOIS record.",
        };

    return { domainAge, registrar };
  } catch (error) {
    logger.error("WHOIS check failed", { hostname, error: String(error) });
    return unavailablePair("WHOIS check failed — result temporarily unavailable.");
  }
}
