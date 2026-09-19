import type {
  AnalyticsInsight,
  WebsiteAnalytics,
  PhishingAnalytics,
  PasswordAnalytics,
  PrivacyAnalytics,
  BreachAnalytics,
  LearningAnalytics,
} from "../types";

const MAX_INSIGHTS = 5;

export interface InsightInputs {
  website: WebsiteAnalytics;
  phishing: PhishingAnalytics;
  password: PasswordAnalytics;
  privacy: PrivacyAnalytics;
  breach: BreachAnalytics;
  learning: LearningAnalytics;
}

/** Every insight here is a direct, literal reading of the aggregated data passed in — no inference beyond what the numbers already show. */
export function buildSecurityInsights(inputs: InsightInputs): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (inputs.privacy.trend && inputs.privacy.trend.points.length >= 3) {
    const points = inputs.privacy.trend.points;
    const recent = points.slice(-3);
    if (recent[recent.length - 1].score > recent[0].score) {
      insights.push({ text: `You've improved your privacy score across your last ${recent.length} resume scans.` });
    }
  }

  if (inputs.password.mfaChecked === false) {
    insights.push({ text: "You haven't completed the MFA item on your account security checklist yet." });
  }

  if (inputs.password.passwordManagerChecked === false) {
    insights.push({ text: "You haven't marked using a password manager on your account security checklist yet." });
  }

  if (inputs.phishing.totalAnalyzed >= 3 && inputs.phishing.suspiciousCount + inputs.phishing.likelyPhishingCount > 0) {
    insights.push({
      text: `You've analyzed ${inputs.phishing.totalAnalyzed} emails recently, with ${
        inputs.phishing.suspiciousCount + inputs.phishing.likelyPhishingCount
      } flagged as suspicious or likely phishing.`,
    });
  }

  if (inputs.website.riskDistribution.risk > 0) {
    insights.push({ text: `${inputs.website.riskDistribution.risk} of your scanned websites were flagged as high risk.` });
  }

  if (inputs.breach.knownExposures > 0) {
    insights.push({
      text: `${inputs.breach.knownExposures} of your breach checks found known exposures — review your password security for those accounts.`,
    });
  }

  if (inputs.learning.currentStreak >= 3) {
    insights.push({ text: `You're on a ${inputs.learning.currentStreak}-day learning streak.` });
  }

  if (inputs.learning.lessonsCompleted > 0 && insights.length < MAX_INSIGHTS) {
    insights.push({
      text: `You've completed ${inputs.learning.lessonsCompleted} Learning Hub lesson${
        inputs.learning.lessonsCompleted === 1 ? "" : "s"
      } so far.`,
    });
  }

  return insights.slice(0, MAX_INSIGHTS);
}
