import { describe, it, expect } from "vitest";
import { buildSecurityInsights } from "../securityInsights";
import type { WebsiteAnalytics, PhishingAnalytics, PasswordAnalytics, PrivacyAnalytics, BreachAnalytics, LearningAnalytics } from "../../types";

const EMPTY_WEBSITE: WebsiteAnalytics = { totalScanned: 0, averageScore: null, highestRiskScan: null, lowestRiskScan: null, riskDistribution: { safe: 0, caution: 0, risk: 0 }, trend: null };
const EMPTY_PHISHING: PhishingAnalytics = { totalAnalyzed: 0, averageScore: null, suspiciousCount: 0, likelyPhishingCount: 0, riskDistribution: { safe: 0, caution: 0, risk: 0 }, trend: null };
const EMPTY_PASSWORD: PasswordAnalytics = { assessmentsCompleted: 0, averageScore: null, trend: null, checklistCompletionPercent: null, mfaChecked: null, passwordManagerChecked: null };
const EMPTY_PRIVACY: PrivacyAnalytics = { totalScans: 0, averageScore: null, trend: null, mostCommonFindingSummaries: [] };
const EMPTY_BREACH: BreachAnalytics = { totalChecks: 0, knownExposures: 0, mostRecentCheck: null, exposureCategoriesSeen: 0 };
const EMPTY_LEARNING: LearningAnalytics = { lessonsCompleted: 0, quizCompletionRate: null, averageQuizScore: null, xpEarned: 0, currentLevel: 1, levelTitle: "Cybersecurity Beginner", currentStreak: 0, categoriesCompleted: 0, totalCategories: 7 };

describe("buildSecurityInsights", () => {
  it("generates zero insights when there is no activity at all", () => {
    const insights = buildSecurityInsights({
      website: EMPTY_WEBSITE,
      phishing: EMPTY_PHISHING,
      password: EMPTY_PASSWORD,
      privacy: EMPTY_PRIVACY,
      breach: EMPTY_BREACH,
      learning: EMPTY_LEARNING,
    });
    expect(insights).toHaveLength(0);
  });

  it("flags an incomplete MFA checklist item only when it's explicitly false, not just unknown", () => {
    const withUnknown = buildSecurityInsights({
      website: EMPTY_WEBSITE,
      phishing: EMPTY_PHISHING,
      password: EMPTY_PASSWORD, // mfaChecked: null
      privacy: EMPTY_PRIVACY,
      breach: EMPTY_BREACH,
      learning: EMPTY_LEARNING,
    });
    expect(withUnknown.some((i) => i.text.includes("MFA"))).toBe(false);

    const withFalse = buildSecurityInsights({
      website: EMPTY_WEBSITE,
      phishing: EMPTY_PHISHING,
      password: { ...EMPTY_PASSWORD, mfaChecked: false },
      privacy: EMPTY_PRIVACY,
      breach: EMPTY_BREACH,
      learning: EMPTY_LEARNING,
    });
    expect(withFalse.some((i) => i.text.includes("MFA"))).toBe(true);
  });

  it("caps insights at 5 even when many conditions are met", () => {
    const insights = buildSecurityInsights({
      website: { ...EMPTY_WEBSITE, riskDistribution: { safe: 0, caution: 0, risk: 2 } },
      phishing: { ...EMPTY_PHISHING, totalAnalyzed: 5, suspiciousCount: 2, likelyPhishingCount: 1 },
      password: { ...EMPTY_PASSWORD, mfaChecked: false, passwordManagerChecked: false },
      privacy: EMPTY_PRIVACY,
      breach: { ...EMPTY_BREACH, knownExposures: 1 },
      learning: { ...EMPTY_LEARNING, currentStreak: 5, lessonsCompleted: 3 },
    });
    expect(insights.length).toBeLessThanOrEqual(5);
  });

  it("only reports a phishing insight once there's enough analyzed volume to be meaningful", () => {
    const tooFew = buildSecurityInsights({
      website: EMPTY_WEBSITE,
      phishing: { ...EMPTY_PHISHING, totalAnalyzed: 1, suspiciousCount: 1 },
      password: EMPTY_PASSWORD,
      privacy: EMPTY_PRIVACY,
      breach: EMPTY_BREACH,
      learning: EMPTY_LEARNING,
    });
    expect(tooFew.some((i) => i.text.includes("flagged as suspicious"))).toBe(false);
  });
});
