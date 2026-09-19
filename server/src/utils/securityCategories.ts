import type {
  SecurityCategoryResult,
  ScanHistorySummary,
  PasswordHistorySummary,
  BreachHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
  ExposureRiskLevel,
} from "../types";

function average(numbers: number[]): number {
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

function statusForScore(score: number): SecurityCategoryResult["status"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  return "needs-attention";
}

const NO_DATA_BASE = { hasData: false as const, score: null, status: "no-data" as const };

export function calculateWebsiteSecurityCategory(scans: ScanHistorySummary[]): SecurityCategoryResult {
  if (scans.length === 0) {
    return {
      id: "website-security",
      title: "Website Security",
      ...NO_DATA_BASE,
      explanation: "You haven't scanned any websites yet.",
      recommendedAction: "Run your first website scan to start building this category.",
      stats: { scanned: 0, averageRisk: null, highRisk: 0, lowRisk: 0 },
    };
  }

  const score = average(scans.map((s) => s.score));
  const highRisk = scans.filter((s) => s.band === "danger").length;
  const lowRisk = scans.filter((s) => s.band === "safe").length;

  return {
    id: "website-security",
    title: "Website Security",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation: `Based on ${scans.length} saved website scan${scans.length === 1 ? "" : "s"}, averaging a score of ${score}/100.`,
    recommendedAction:
      highRisk > 0
        ? "Review the websites previously marked as high risk in your Scan History."
        : "Keep scanning new websites before entering sensitive information.",
    stats: { scanned: scans.length, averageRisk: score, highRisk, lowRisk },
  };
}

export function calculatePasswordSecurityCategory(reports: PasswordHistorySummary[]): SecurityCategoryResult {
  if (reports.length === 0) {
    return {
      id: "password-security",
      title: "Password Security",
      ...NO_DATA_BASE,
      explanation: "You haven't saved a password analysis yet.",
      recommendedAction: "Check a password's strength in the Password Security Center.",
      stats: { analyses: 0, averageScore: null, checklistCompletion: null },
    };
  }

  const score = average(reports.map((r) => r.score));
  const latest = [...reports].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0];

  return {
    id: "password-security",
    title: "Password Security",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation: `Based on ${reports.length} saved password analys${reports.length === 1 ? "is" : "es"}, averaging a score of ${score}/100. Your account security checklist was ${latest.checklistCompletionPercent}% complete as of your last saved analysis.`,
    recommendedAction:
      latest.checklistCompletionPercent < 100
        ? "Finish your Account Security Checklist in the Password Security Center."
        : "Keep using unique, strong passwords across your accounts.",
    stats: { analyses: reports.length, averageScore: score, checklistCompletion: latest.checklistCompletionPercent },
  };
}

const EXPOSURE_LEVEL_TO_SCORE: Record<ExposureRiskLevel, number> = { low: 90, moderate: 65, high: 35, severe: 10 };

export function calculateAccountExposureCategory(reports: BreachHistorySummary[]): SecurityCategoryResult {
  if (reports.length === 0) {
    return {
      id: "account-exposure",
      title: "Account Exposure",
      ...NO_DATA_BASE,
      explanation: "You haven't run a breach check yet.",
      recommendedAction: "Run your first breach check.",
      stats: { checksRun: 0, mostRecentBreachCount: null, mostRecentRiskLevel: null },
    };
  }

  const sorted = [...reports].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  const latest = sorted[0];
  // Approximate, since only the risk *level* (not the exact 0–100 score) is kept in the lightweight history summary.
  const score = EXPOSURE_LEVEL_TO_SCORE[latest.riskLevel];

  return {
    id: "account-exposure",
    title: "Account Exposure",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation:
      latest.breachCount > 0
        ? `Your most recent check (${latest.maskedEmail}) found ${latest.breachCount} known breach${latest.breachCount === 1 ? "" : "es"}.`
        : `Your most recent check (${latest.maskedEmail}) found no known breaches — this doesn't guarantee the account was never exposed.`,
    recommendedAction:
      latest.breachCount > 0
        ? "Review your password security and consider enabling MFA on affected accounts."
        : "Periodically re-check your email, since new breaches are discovered over time.",
    stats: { checksRun: reports.length, mostRecentBreachCount: latest.breachCount, mostRecentRiskLevel: latest.riskLevel },
  };
}

export function calculatePrivacyCategory(reports: ResumeReportSummary[]): SecurityCategoryResult {
  if (reports.length === 0) {
    return {
      id: "privacy",
      title: "Privacy",
      ...NO_DATA_BASE,
      explanation: "You haven't analyzed a resume yet.",
      recommendedAction: "Check your resume's privacy exposure in the Resume Privacy Scanner.",
      stats: { reportsCompleted: 0, averageScore: null, mostRecentScore: null },
    };
  }

  const score = average(reports.map((r) => r.privacyScore));
  const latest = [...reports].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0];

  return {
    id: "privacy",
    title: "Privacy",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation: `Based on ${reports.length} resume privacy report${reports.length === 1 ? "" : "s"}, averaging a score of ${score}/100.`,
    recommendedAction:
      score < 75
        ? "Remove unnecessary personal information from your resume."
        : "Your resumes show a reasonable privacy balance — keep reviewing before sharing new versions.",
    stats: { reportsCompleted: reports.length, averageScore: score, mostRecentScore: latest.privacyScore },
  };
}

export function calculatePhishingAwarenessCategory(reports: EmailHistorySummary[]): SecurityCategoryResult {
  if (reports.length === 0) {
    return {
      id: "phishing-awareness",
      title: "Phishing Awareness",
      ...NO_DATA_BASE,
      explanation: "You haven't analyzed an email yet.",
      recommendedAction: "Analyze a suspicious email in the Email Phishing Analyzer.",
      stats: { analyzed: 0, averageRisk: null, suspiciousDetected: 0 },
    };
  }

  const score = average(reports.map((r) => r.riskScore));
  const suspiciousDetected = reports.filter(
    (r) => r.classification === "suspicious" || r.classification === "likely-phishing"
  ).length;

  return {
    id: "phishing-awareness",
    title: "Phishing Awareness",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation: `Based on ${reports.length} analyzed email${reports.length === 1 ? "" : "s"}, ${suspiciousDetected} flagged as suspicious or likely phishing.`,
    recommendedAction:
      suspiciousDetected > 0
        ? "Review your recent phishing analyses and avoid clicking links in flagged emails."
        : "Keep checking unexpected emails before clicking links or replying with sensitive info.",
    stats: { analyzed: reports.length, averageRisk: score, suspiciousDetected },
  };
}

/**
 * Now that the Learning Hub exists, this category has real data —
 * it was a permanent no-data placeholder before. Score reflects a
 * simple average of lesson-completion percentage and average quiz
 * score, so it can never be inflated by simply opening pages: both
 * inputs require real completed activity (marking a lesson complete,
 * or submitting a graded quiz).
 */
export function calculateEducationCategory(stats: {
  lessonsCompleted: number;
  quizzesCompleted: number;
  averageQuizScore: number | null;
  totalAvailableLessons: number;
}): SecurityCategoryResult {
  if (stats.lessonsCompleted === 0) {
    return {
      id: "education",
      title: "Cybersecurity Education",
      ...NO_DATA_BASE,
      explanation: "You haven't completed a lesson in the Learning Hub yet.",
      recommendedAction: "Start your first lesson in the Learning Hub.",
      stats: { lessonsCompleted: 0, quizzesCompleted: 0, averageQuizScore: null },
    };
  }

  const completionPercent =
    stats.totalAvailableLessons > 0 ? (stats.lessonsCompleted / stats.totalAvailableLessons) * 100 : 0;
  const score = stats.averageQuizScore !== null ? average([completionPercent, stats.averageQuizScore]) : Math.round(completionPercent);

  return {
    id: "education",
    title: "Cybersecurity Education",
    hasData: true,
    score,
    status: statusForScore(score),
    explanation: `You've completed ${stats.lessonsCompleted} of ${stats.totalAvailableLessons} available lessons${
      stats.averageQuizScore !== null ? `, averaging ${stats.averageQuizScore}% on quizzes` : ""
    }. Learning progress reflects your engagement with these tools' concepts — it doesn't by itself prove your accounts or devices are technically secure.`,
    recommendedAction:
      completionPercent < 100 ? "Continue your progress in the Learning Hub." : "Great progress — check back as new lessons are added.",
    stats: {
      lessonsCompleted: stats.lessonsCompleted,
      quizzesCompleted: stats.quizzesCompleted,
      averageQuizScore: stats.averageQuizScore,
    },
  };
}
