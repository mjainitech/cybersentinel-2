import type { ThreatEntry, ThreatOverviewMetrics } from "../types";

/**
 * Every number here traces to something real: either a count of our
 * own curated entries (deterministic, always available) or a live
 * count from NVD (nullable — if that fetch failed, the metric is
 * null and vulnerabilityDataUnavailable is set, rather than showing
 * a stale or fabricated number).
 */
export function buildThreatOverview(
  entries: ThreatEntry[],
  criticalCveCount: number | null,
  lastNvdSuccess: string | null
): ThreatOverviewMetrics {
  const recentAdvisories = entries.filter((e) => e.severity === "high" || e.severity === "critical").length;
  const recentPhishingTrends = entries.filter((e) => e.category === "phishing" || e.category === "social-engineering").length;

  return {
    threatsTracked: entries.length,
    recentAdvisories,
    criticalVulnerabilities: criticalCveCount,
    recentPhishingTrends,
    lastUpdated: lastNvdSuccess,
    vulnerabilityDataUnavailable: criticalCveCount === null,
  };
}
