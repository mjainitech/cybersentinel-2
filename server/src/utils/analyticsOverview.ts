import type { AnalyticsOverview, SecurityScoreSnapshot, SecurityRecommendation } from "../types";

export function buildAnalyticsOverview(
  snapshots: SecurityScoreSnapshot[],
  totalSecurityChecks: number,
  securityChecksThisMonth: number,
  learningProgressPercent: number | null,
  topPriorities: SecurityRecommendation[],
  threatsReviewed: number
): AnalyticsOverview {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  const scoreChange =
    latest && previous && latest.overallScore !== null && previous.overallScore !== null
      ? latest.overallScore - previous.overallScore
      : null;

  return {
    overallScore: latest?.overallScore ?? null,
    scoreChange,
    totalSecurityChecks,
    securityChecksThisMonth,
    learningProgressPercent,
    openRecommendations: topPriorities.length,
    threatsReviewed,
    hasEnoughData: totalSecurityChecks > 0,
  };
}
