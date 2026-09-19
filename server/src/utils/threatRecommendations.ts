import type { ThreatCategory, ThreatRecommendation } from "../types";

/**
 * One general recommendation per category, matching the spec's exact
 * examples ("Review the Website Security lesson", "Practice with the
 * Email Phishing Analyzer", etc.) — used as a fallback alongside any
 * entry-specific relatedLessonId/relatedToolHref.
 */
const CATEGORY_RECOMMENDATIONS: Record<ThreatCategory, ThreatRecommendation[]> = {
  phishing: [{ label: "Practice with the Email Phishing Analyzer", href: "/dashboard/email-scanner" }],
  "social-engineering": [{ label: "Practice with the Email Phishing Analyzer", href: "/dashboard/email-scanner" }],
  malware: [{ label: "Review the Malware lessons", href: "/dashboard/learning-hub" }],
  ransomware: [{ label: "Review the Malware lessons", href: "/dashboard/learning-hub" }],
  "data-breaches": [{ label: "Check for Data Breaches", href: "/dashboard/breach-checker" }],
  "identity-theft": [{ label: "Review Password Security", href: "/dashboard/password-center" }],
  vulnerabilities: [{ label: "Review the Web Security lesson", href: "/dashboard/learning-hub" }],
  "web-security": [{ label: "Try the Website Scanner", href: "/dashboard/url-scanner" }],
};

export function getRecommendationsForCategory(category: ThreatCategory): ThreatRecommendation[] {
  return CATEGORY_RECOMMENDATIONS[category] ?? [];
}
