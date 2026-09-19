import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { severityFromCvssScore } from "../utils/threatSeverity";
import type { CveRecord } from "../types";

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

/**
 * NVD's public API works without a key at a lower rate limit (~5
 * requests / 30s); a free key (https://nvd.nist.gov/developers/request-an-api-key)
 * raises that to ~50 requests / 30s. Never required, unlike HIBP.
 *
 * HONESTY NOTE: this integration is written against NVD API v2.0's
 * publicly documented response schema, but has not been verified
 * against a live call in this environment (no network access here).
 * The response-shape types below reflect my best understanding of
 * that schema; if NVD changes their schema or if any assumption here
 * is wrong, the mapping functions fail closed (return "unavailable"
 * or skip the malformed record) rather than crash or show bad data.
 */

interface NvdCvssData {
  baseScore?: number;
  baseSeverity?: string;
}
interface NvdCvssMetric {
  cvssData?: NvdCvssData;
}
interface NvdCveDescription {
  lang: string;
  value: string;
}
interface NvdReference {
  url: string;
}
interface NvdCpeMatch {
  criteria?: string;
}
interface NvdConfigNode {
  cpeMatch?: NvdCpeMatch[];
}
interface NvdConfiguration {
  nodes?: NvdConfigNode[];
}
interface NvdCve {
  id: string;
  published?: string;
  lastModified?: string;
  descriptions?: NvdCveDescription[];
  references?: NvdReference[];
  configurations?: NvdConfiguration[];
  metrics?: {
    cvssMetricV31?: NvdCvssMetric[];
    cvssMetricV30?: NvdCvssMetric[];
    cvssMetricV2?: NvdCvssMetric[];
  };
}
interface NvdVulnerability {
  cve: NvdCve;
}
interface NvdResponse {
  totalResults?: number;
  vulnerabilities?: NvdVulnerability[];
}

/** Extracts a rough vendor:product list from CPE 2.3 URI strings, e.g. "cpe:2.3:a:apache:log4j:..." -> "apache log4j". */
function extractAffectedProducts(cve: NvdCve): string[] {
  const products = new Set<string>();

  for (const config of cve.configurations ?? []) {
    for (const node of config.nodes ?? []) {
      for (const match of node.cpeMatch ?? []) {
        const parts = match.criteria?.split(":");
        // CPE 2.3 format: cpe:2.3:{part}:{vendor}:{product}:{version}:...
        if (parts && parts.length > 4) {
          const vendor = parts[3];
          const product = parts[4];
          if (vendor && product && vendor !== "*" && product !== "*") {
            products.add(`${vendor} ${product}`.replace(/_/g, " "));
          }
        }
      }
    }
  }

  return Array.from(products).slice(0, 12);
}

function extractCvssScore(cve: NvdCve): number | null {
  const metric =
    cve.metrics?.cvssMetricV31?.[0] ?? cve.metrics?.cvssMetricV30?.[0] ?? cve.metrics?.cvssMetricV2?.[0];
  return typeof metric?.cvssData?.baseScore === "number" ? metric.cvssData.baseScore : null;
}

function mapCveToRecord(cve: NvdCve): CveRecord | null {
  // Fail closed on a malformed record rather than showing broken/partial data.
  if (!cve.id) return null;

  const description = cve.descriptions?.find((d) => d.lang === "en")?.value ?? "No description available.";
  const cvssScore = extractCvssScore(cve);

  return {
    id: cve.id,
    severity: severityFromCvssScore(cvssScore),
    cvssScore,
    description,
    affectedProducts: extractAffectedProducts(cve),
    publishedDate: cve.published ?? "",
    lastModifiedDate: cve.lastModified ?? "",
    referenceUrl: cve.references?.[0]?.url ?? `https://nvd.nist.gov/vuln/detail/${cve.id}`,
  };
}

export type NvdResult =
  | { ok: true; records: CveRecord[]; totalResults: number }
  | { ok: false; status: "rate-limited" | "unavailable" | "timeout" | "not-found"; message: string };

async function callNvd(params: Record<string, string>): Promise<NvdResult> {
  try {
    const query = new URLSearchParams(params);
    const response = await fetchWithTimeout(
      `${NVD_BASE}?${query.toString()}`,
      {
        headers: env.NVD_API_KEY ? { apiKey: env.NVD_API_KEY } : {},
      },
      12_000
    );

    if (response.status === 404) {
      return { ok: false, status: "not-found", message: "No matching vulnerability was found." };
    }
    if (response.status === 429) {
      return { ok: false, status: "rate-limited", message: "Too many vulnerability lookups right now. Please try again shortly." };
    }
    if (!response.ok) {
      throw new Error(`NVD responded with ${response.status}`);
    }

    const body = (await response.json()) as NvdResponse;
    const records = (body.vulnerabilities ?? [])
      .map((v) => mapCveToRecord(v.cve))
      .filter((r): r is CveRecord => r !== null);

    return { ok: true, records, totalResults: body.totalResults ?? records.length };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    logger.error("NVD API call failed", { error: String(error) });
    return {
      ok: false,
      status: isTimeout ? "timeout" : "unavailable",
      message: isTimeout
        ? "The vulnerability database took too long to respond."
        : "The vulnerability database is temporarily unavailable.",
    };
  }
}

/** Fetches CVEs published within the last N days, most recent first. */
export async function getRecentCves(days = 30, resultsPerPage = 20): Promise<NvdResult> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const result = await callNvd({
    pubStartDate: start.toISOString().slice(0, 19),
    pubEndDate: end.toISOString().slice(0, 19),
    resultsPerPage: String(resultsPerPage),
  });

  if (!result.ok) return result;

  // NVD's default ordering within a date range isn't guaranteed newest-first — sort explicitly.
  const sorted = [...result.records].sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  return { ...result, records: sorted };
}

export async function getCveById(cveId: string): Promise<NvdResult> {
  return callNvd({ cveId });
}

export async function searchCves(keyword: string, resultsPerPage = 20): Promise<NvdResult> {
  return callNvd({ keywordSearch: keyword, resultsPerPage: String(resultsPerPage) });
}

/** Counts CVEs at critical severity (CVSS >= 9.0) published within the last N days — used for the overview metric. */
export async function countRecentCriticalCves(days = 30): Promise<number | null> {
  const result = await getRecentCves(days, 200);
  if (!result.ok) return null;
  return result.records.filter((r) => r.severity === "critical").length;
}
