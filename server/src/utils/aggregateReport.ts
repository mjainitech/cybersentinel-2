import type { CheckStatus, ScanCheckResult, ScanReportResponse } from "../types";
import { getCheckCategory } from "./checkCategory";
import { generateRecommendations } from "./recommendations";

/** Score deducted from a perfect 100 for each check that isn't "safe". "unknown" costs nothing — we don't penalize a site for our own API failures. */
const SCORE_PENALTY: Record<CheckStatus, number> = { safe: 0, warning: 6, danger: 20, unknown: 0 };

function getRating(score: number): ScanReportResponse["rating"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * Confidence reflects how much of the report we could actually verify
 * — not how safe the site is. A site with 3 unavailable checks might
 * still score well on what *did* run, but that result deserves a
 * lower-confidence label so it isn't mistaken for a complete picture.
 */
function getConfidence(unavailableCount: number): ScanReportResponse["confidence"] {
  if (unavailableCount === 0) return "high";
  if (unavailableCount <= 2) return "medium";
  return "low";
}

/**
 * Combines individual check results into the final report: tags each
 * check with its report category, computes the 0–100 score, letter
 * rating, safe/warning/danger band, confidence level, a plain-language
 * recommendation, a short list of specific actionable recommendations,
 * and flags which checks (if any) couldn't complete so the frontend
 * can show a "partial results" notice instead of silently pretending
 * everything succeeded.
 */
export function aggregateReport(
  url: string,
  rawChecks: ScanCheckResult[],
  options: { cached?: boolean; cachedAt?: number } = {}
): Omit<ScanReportResponse, "aiExplanation"> {
  const checks = rawChecks.map((check) => ({ ...check, category: getCheckCategory(check.id) }));

  const totalPenalty = checks.reduce((sum, check) => sum + SCORE_PENALTY[check.status], 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  const band: Exclude<CheckStatus, "unknown"> = score >= 80 ? "safe" : score >= 50 ? "warning" : "danger";

  const recommendation =
    band === "safe"
      ? "This website appears safe."
      : band === "warning"
      ? "This website should be approached cautiously."
      : "This website has multiple security concerns.";

  const unavailableChecks = checks.filter((check) => check.status === "unknown").map((check) => check.id);

  return {
    url,
    score,
    band,
    rating: getRating(score),
    confidence: getConfidence(unavailableChecks.length),
    recommendation,
    checks,
    recommendations: generateRecommendations(checks),
    meta: {
      partial: unavailableChecks.length > 0,
      unavailableChecks,
      cached: options.cached ?? false,
      cachedAt: options.cachedAt ? new Date(options.cachedAt).toISOString() : undefined,
      scannedAt: new Date().toISOString(),
    },
  };
}
