import type {
  SecurityTrendSeries,
  ScanHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
  PasswordHistorySummary,
} from "../types";

/** Below this many data points, a "trend" isn't meaningful — the UI shows an empty state instead. */
const MIN_TREND_POINTS = 3;

function toSeries(
  category: SecurityTrendSeries["category"],
  label: string,
  points: { date: string; score: number }[]
): SecurityTrendSeries | null {
  if (points.length < MIN_TREND_POINTS) return null;

  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return { category, label, points: sorted };
}

interface TrendInputs {
  scans: ScanHistorySummary[];
  resumeReports: ResumeReportSummary[];
  emailReports: EmailHistorySummary[];
  passwordReports: PasswordHistorySummary[];
}

/**
 * Builds one trend line per category, using each category's own
 * historical scores directly. Deliberately does not attempt to
 * reconstruct a synthetic "overall score over time" line — that would
 * require aligning five differently-timed, differently-weighted data
 * sources retroactively, which risks implying more precision than
 * the underlying data actually supports.
 */
export function buildSecurityTrends(inputs: TrendInputs): SecurityTrendSeries[] {
  const series = [
    toSeries(
      "website-security",
      "Website Risk",
      inputs.scans.map((s) => ({ date: s.scannedAt, score: s.score }))
    ),
    toSeries(
      "privacy",
      "Privacy Score",
      inputs.resumeReports.map((r) => ({ date: r.analyzedAt, score: r.privacyScore }))
    ),
    toSeries(
      "phishing-awareness",
      "Phishing Awareness",
      inputs.emailReports.map((e) => ({ date: e.analyzedAt, score: e.riskScore }))
    ),
    toSeries(
      "password-security",
      "Password Security Score",
      inputs.passwordReports.map((p) => ({ date: p.analyzedAt, score: p.score }))
    ),
  ];

  return series.filter((s): s is SecurityTrendSeries => s !== null);
}
