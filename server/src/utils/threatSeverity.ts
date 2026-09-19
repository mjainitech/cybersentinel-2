import type { ThreatSeverity } from "../types";

/**
 * Maps a CVSS v3 base score to its standard severity rating, per the
 * official scale published by NVD/FIRST — this is not an invented
 * threshold: https://nvd.nist.gov/vuln-metrics/cvss
 */
export function severityFromCvssScore(score: number | null): ThreatSeverity | "unknown" {
  if (score === null) return "unknown";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

export const SEVERITY_LABELS: Record<ThreatSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SEVERITY_ORDER: Record<ThreatSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
