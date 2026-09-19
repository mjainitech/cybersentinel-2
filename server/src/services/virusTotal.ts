import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

const VT_BASE = "https://www.virustotal.com/api/v3";

/** VirusTotal's URL identifier: URL-safe base64 of the URL, no padding. */
function toUrlId(url: string): string {
  return Buffer.from(url).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Checks a URL against VirusTotal's aggregated engine verdicts.
 * If VirusTotal has never seen the URL before, we submit it for
 * analysis and report "unknown" for this request rather than
 * blocking — VirusTotal analyses can take longer than a user is
 * willing to wait on a single page load. The URL will be available
 * on a subsequent scan once VirusTotal finishes processing it.
 */
export async function getVirusTotalCheck(url: string): Promise<ScanCheckResult> {
  const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "malware-reputation",
    title: "Malware & Phishing Reputation",
  };

  if (!env.VIRUSTOTAL_API_KEY) {
    return {
      ...base,
      status: "unknown",
      value: "Not configured",
      summary: "VirusTotal check unavailable — no API key configured on the server.",
    };
  }

  try {
    const response = await fetchWithTimeout(`${VT_BASE}/urls/${toUrlId(url)}`, {
      headers: { "x-apikey": env.VIRUSTOTAL_API_KEY },
    });

    if (response.status === 404) {
      // Not previously scanned — submit it so it's available next time.
      await submitForAnalysis(url).catch((error) =>
        logger.error("VirusTotal submission failed", { url, error: String(error) })
      );
      return {
        ...base,
        status: "unknown",
        value: "Not yet analyzed",
        summary: "This URL hasn't been analyzed by VirusTotal before — a scan has been submitted for next time.",
      };
    }

    if (!response.ok) {
      throw new Error(`VirusTotal responded with ${response.status}`);
    }

    const payload = await response.json();
    const stats = payload?.data?.attributes?.last_analysis_stats;

    if (!stats) {
      throw new Error("VirusTotal response missing last_analysis_stats");
    }

    const malicious = Number(stats.malicious ?? 0);
    const suspicious = Number(stats.suspicious ?? 0);
    const total = Object.values(stats).reduce((sum: number, n) => sum + Number(n ?? 0), 0);

    const status = malicious > 0 ? "danger" : suspicious > 0 ? "warning" : "safe";
    const summary =
      malicious > 0
        ? `${malicious} of ${total} security vendors flag this URL as malicious.`
        : suspicious > 0
        ? `${suspicious} of ${total} security vendors flag this URL as suspicious.`
        : `No security vendors flagged this URL out of ${total} checked.`;

    return {
      ...base,
      status,
      value: `${malicious} malicious · ${suspicious} suspicious · ${total} engines`,
      summary,
    };
  } catch (error) {
    logger.error("VirusTotal check failed", { url, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "VirusTotal check failed — result temporarily unavailable.",
    };
  }
}

async function submitForAnalysis(url: string): Promise<void> {
  await fetchWithTimeout(`${VT_BASE}/urls`, {
    method: "POST",
    headers: {
      "x-apikey": env.VIRUSTOTAL_API_KEY!,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `url=${encodeURIComponent(url)}`,
  });
}
