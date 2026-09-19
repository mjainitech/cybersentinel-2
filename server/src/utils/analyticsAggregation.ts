import type {
  ScanHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
  PasswordHistorySummary,
  BreachHistorySummary,
  WebsiteAnalytics,
  PhishingAnalytics,
  PasswordAnalytics,
  PrivacyAnalytics,
  BreachAnalytics,
  RiskDistribution,
} from "../types";
import { buildSecurityTrends } from "./securityTrends";

/**
 * PERFORMANCE NOTE: everything here is built from the lightweight
 * *Summary shapes already used by each feature's own history page —
 * never from fetching every individual full record, per the spec's
 * explicit performance requirement. Two fields the spec asked for
 * ("common privacy findings", "common detected indicators") aren't
 * present on the lightweight summaries (only on full records); rather
 * than fetch every record to reconstruct them, this substitutes the
 * closest thing the summary already contains — rating/classification
 * distribution — which is honest, real data, just coarser-grained.
 * Documented here rather than silently narrowed.
 */

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

export function buildWebsiteAnalytics(scans: ScanHistorySummary[]): WebsiteAnalytics {
  if (scans.length === 0) {
    return {
      totalScanned: 0,
      averageScore: null,
      highestRiskScan: null,
      lowestRiskScan: null,
      riskDistribution: { safe: 0, caution: 0, risk: 0 },
      trend: null,
    };
  }

  const sortedByScore = [...scans].sort((a, b) => a.score - b.score);
  const lowestScore = sortedByScore[0];
  const highestScore = sortedByScore[sortedByScore.length - 1];

  const riskDistribution: RiskDistribution = {
    safe: scans.filter((s) => s.band === "safe").length,
    caution: scans.filter((s) => s.band === "warning").length,
    risk: scans.filter((s) => s.band === "danger").length,
  };

  const trends = buildSecurityTrends({ scans, resumeReports: [], emailReports: [], passwordReports: [] });

  return {
    totalScanned: scans.length,
    averageScore: average(scans.map((s) => s.score)),
    // "Highest-risk" means the lowest safety score, not the highest number.
    highestRiskScan: { url: lowestScore.url, score: lowestScore.score },
    lowestRiskScan: { url: highestScore.url, score: highestScore.score },
    riskDistribution,
    trend: trends.find((t) => t.category === "website-security") ?? null,
  };
}

export function buildPhishingAnalytics(reports: EmailHistorySummary[]): PhishingAnalytics {
  if (reports.length === 0) {
    return {
      totalAnalyzed: 0,
      averageScore: null,
      suspiciousCount: 0,
      likelyPhishingCount: 0,
      riskDistribution: { safe: 0, caution: 0, risk: 0 },
      trend: null,
    };
  }

  const riskDistribution: RiskDistribution = {
    safe: reports.filter((r) => r.classification === "likely-safe").length,
    caution: reports.filter((r) => r.classification === "use-caution").length,
    risk: reports.filter((r) => r.classification === "suspicious" || r.classification === "likely-phishing").length,
  };

  const trends = buildSecurityTrends({ scans: [], resumeReports: [], emailReports: reports, passwordReports: [] });

  return {
    totalAnalyzed: reports.length,
    averageScore: average(reports.map((r) => r.riskScore)),
    suspiciousCount: reports.filter((r) => r.classification === "suspicious").length,
    likelyPhishingCount: reports.filter((r) => r.classification === "likely-phishing").length,
    riskDistribution,
    trend: trends.find((t) => t.category === "phishing-awareness") ?? null,
  };
}

export function buildPasswordAnalytics(
  reports: PasswordHistorySummary[],
  latestChecklist: { usesMfa: boolean; usesPasswordManager: boolean } | null
): PasswordAnalytics {
  const trends = buildSecurityTrends({ scans: [], resumeReports: [], emailReports: [], passwordReports: reports });
  const latest =
    reports.length > 0
      ? [...reports].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0]
      : null;

  return {
    assessmentsCompleted: reports.length,
    averageScore: average(reports.map((r) => r.score)),
    trend: trends.find((t) => t.category === "password-security") ?? null,
    checklistCompletionPercent: latest?.checklistCompletionPercent ?? null,
    mfaChecked: latestChecklist?.usesMfa ?? null,
    passwordManagerChecked: latestChecklist?.usesPasswordManager ?? null,
  };
}

export function buildPrivacyAnalytics(reports: ResumeReportSummary[]): PrivacyAnalytics {
  const trends = buildSecurityTrends({ scans: [], resumeReports: reports, emailReports: [], passwordReports: [] });

  const ratingCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.privacyRating] = (acc[r.privacyRating] ?? 0) + 1;
    return acc;
  }, {});
  const mostCommonFindingSummaries = Object.entries(ratingCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([rating, count]) => `"${rating}" rating in ${count} of ${reports.length} scan${reports.length === 1 ? "" : "s"}`);

  return {
    totalScans: reports.length,
    averageScore: average(reports.map((r) => r.privacyScore)),
    trend: trends.find((t) => t.category === "privacy") ?? null,
    mostCommonFindingSummaries,
  };
}

export function buildBreachAnalytics(
  reports: BreachHistorySummary[],
  mostRecentExposureCategoryCount: number | null
): BreachAnalytics {
  if (reports.length === 0) {
    return { totalChecks: 0, knownExposures: 0, mostRecentCheck: null, exposureCategoriesSeen: 0 };
  }

  const sorted = [...reports].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  const latest = sorted[0];

  return {
    totalChecks: reports.length,
    knownExposures: reports.filter((r) => r.breachCount > 0).length,
    mostRecentCheck: { maskedEmail: latest.maskedEmail, riskLevel: latest.riskLevel, checkedAt: latest.checkedAt },
    exposureCategoriesSeen: mostRecentExposureCategoryCount ?? 0,
  };
}
