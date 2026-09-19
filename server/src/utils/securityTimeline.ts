import type {
  SecurityTimelineEntry,
  ScanHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
  PasswordHistorySummary,
  BreachHistorySummary,
} from "../types";

const MAX_TIMELINE_ENTRIES = 15;

interface TimelineInputs {
  scans: ScanHistorySummary[];
  resumeReports: ResumeReportSummary[];
  emailReports: EmailHistorySummary[];
  passwordReports: PasswordHistorySummary[];
  breachReports: BreachHistorySummary[];
}

/** Combines every feature's history into one chronological activity feed, most recent first. */
export function buildSecurityTimeline(inputs: TimelineInputs): SecurityTimelineEntry[] {
  const entries: SecurityTimelineEntry[] = [
    ...inputs.scans.map(
      (s): SecurityTimelineEntry => ({
        type: "website-scan",
        date: s.scannedAt,
        label: `Scanned ${s.url}`,
        result: s.recommendation,
        riskLevel: s.band === "safe" ? "safe" : s.band === "warning" ? "caution" : "risk",
      })
    ),
    ...inputs.resumeReports.map(
      (r): SecurityTimelineEntry => ({
        type: "resume-analysis",
        date: r.analyzedAt,
        label: `Analyzed resume "${r.fileName}"`,
        result: r.summary,
        riskLevel:
          r.privacyRating === "excellent" || r.privacyRating === "good"
            ? "safe"
            : r.privacyRating === "needs-improvement"
            ? "caution"
            : "risk",
      })
    ),
    ...inputs.emailReports.map(
      (e): SecurityTimelineEntry => ({
        type: "phishing-analysis",
        date: e.analyzedAt,
        label: "Analyzed an email",
        result: e.summary,
        riskLevel: e.classification === "likely-safe" ? "safe" : e.classification === "use-caution" ? "caution" : "risk",
      })
    ),
    ...inputs.passwordReports.map(
      (p): SecurityTimelineEntry => ({
        type: "password-assessment",
        date: p.analyzedAt,
        label: "Completed a password assessment",
        result: `Score: ${p.score}/100`,
        riskLevel: p.score >= 75 ? "safe" : p.score >= 50 ? "caution" : "risk",
      })
    ),
    ...inputs.breachReports.map(
      (b): SecurityTimelineEntry => ({
        type: "breach-check",
        date: b.checkedAt,
        label: `Checked ${b.maskedEmail} for breaches`,
        result: b.breachCount > 0 ? `${b.breachCount} breach(es) found` : "No known breaches found",
        riskLevel: b.riskLevel === "low" ? "safe" : b.riskLevel === "moderate" ? "caution" : "risk",
      })
    ),
  ];

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, MAX_TIMELINE_ENTRIES);
}
