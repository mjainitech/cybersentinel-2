import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../services/logger";
import { TTLCache } from "../services/cache";
import { getVirusTotalCheck } from "../services/virusTotal";
import { getUrlscanCheck } from "../services/urlscan";
import { getWhoisChecks } from "../services/whois";
import { getIpAddressCheck } from "../services/ipGeolocation";
import { getDnsCheck } from "../services/dnsInfo";
import { getHttpsAndSslChecks } from "../services/httpsCheck";
import { getSecurityHeadersCheck } from "../services/securityHeaders";
import { getRedirectsCheck } from "../services/redirects";
import { getAiExplanation } from "../services/aiExplanation";
import { saveScanForUser } from "../services/scanHistoryStore";
import { normalizeUrl } from "../utils/normalizeUrl";
import { aggregateReport } from "../utils/aggregateReport";
import type { ScanCheckResult, ScanReportResponse } from "../types";

const scanCache = new TTLCache<ScanReportResponse>(env.CACHE_TTL_MS);

/**
 * Runs a settled promise and falls back to a caller-provided
 * "unknown" result if it rejects for any reason that slipped past
 * the service's own try/catch — belt and suspenders so one bad
 * promise can never take down the whole request.
 */
async function safely(promise: Promise<ScanCheckResult>, fallback: ScanCheckResult): Promise<ScanCheckResult> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export async function scanWebsite(req: Request, res: Response, next: NextFunction) {
  const validation = normalizeUrl(req.body?.url);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { url, hostname } = validation;

  const cached = scanCache.get(url);
  if (cached) {
    logger.info("Serving cached scan result", { url });
    const cachedReport: ScanReportResponse = {
      ...cached.value,
      meta: { ...cached.value.meta, cached: true, cachedAt: new Date(cached.cachedAt).toISOString() },
    };
    persistIfAuthenticated(req, cachedReport);
    return res.json(cachedReport);
  }

  try {
    const [https_ssl, dnsCheck, ipCheck, securityHeadersCheck, redirectsCheck, whoisChecks, virusTotalCheck, urlscanCheck] =
      await Promise.all([
        getHttpsAndSslChecks(url, hostname).catch((error) => {
          logger.error("HTTPS/SSL check threw unexpectedly", { url, error: String(error) });
          return {
            https: unknownCheck("https", "HTTPS Enabled"),
            ssl: unknownCheck("ssl-certificate", "SSL Certificate Status"),
          };
        }),
        safely(getDnsCheck(hostname), unknownCheck("dns", "DNS Information")),
        safely(getIpAddressCheck(hostname), unknownCheck("ip-address", "Website IP Address")),
        safely(getSecurityHeadersCheck(url), unknownCheck("security-headers", "Security Headers")),
        safely(getRedirectsCheck(url), unknownCheck("redirects", "Redirects")),
        getWhoisChecks(hostname).catch((error) => {
          logger.error("WHOIS check threw unexpectedly", { url, error: String(error) });
          return {
            domainAge: unknownCheck("domain-age", "Domain Age"),
            registrar: unknownCheck("registrar", "Domain Registrar"),
          };
        }),
        safely(getVirusTotalCheck(url), unknownCheck("malware-reputation", "Malware & Phishing Reputation")),
        safely(getUrlscanCheck(url), unknownCheck("community-verdict", "Community Scan Verdict")),
      ]);

    const checks: ScanCheckResult[] = [
      https_ssl.https,
      https_ssl.ssl,
      whoisChecks.domainAge,
      whoisChecks.registrar,
      ipCheck,
      securityHeadersCheck,
      redirectsCheck,
      dnsCheck,
      virusTotalCheck,
      urlscanCheck,
    ];

    const partialReport = aggregateReport(url, checks);

    // Runs after the checks so the explanation can reference their actual
    // findings. A failure here never blocks the report — it just falls
    // back to a template-based explanation (see aiExplanation.ts).
    const aiExplanation = await getAiExplanation(url, partialReport.score, partialReport.band, checks);

    const report: ScanReportResponse = { ...partialReport, aiExplanation };
    scanCache.set(url, report);

    if (report.meta.partial) {
      logger.warn("Scan completed with partial results", { url, unavailable: report.meta.unavailableChecks });
    }

    // Only signed-in users get scans saved to their history — guests still
    // get the full report, it just isn't persisted anywhere.
    persistIfAuthenticated(req, report);

    return res.json(report);
  } catch (error) {
    // Should be unreachable given the per-check safety nets above, but
    // guarantees the process never crashes on an unexpected failure.
    logger.error("Unexpected error while scanning", { url, error: String(error) });
    return next(error);
  }
}

function persistIfAuthenticated(req: Request, report: ScanReportResponse): void {
  if (!req.userId) return;

  saveScanForUser(req.userId, report).catch((error) =>
    logger.error("Failed to save scan to history", { url: report.url, userId: req.userId, error: String(error) })
  );
}

function unknownCheck(id: string, title: string): ScanCheckResult {
  return { id, title, status: "unknown", value: "Unavailable", summary: "This check failed unexpectedly." };
}
