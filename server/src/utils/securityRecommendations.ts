import type { SecurityCategoryResult, SecurityRecommendation } from "../types";

const CATEGORY_HREF: Record<string, string> = {
  "website-security": "/dashboard/url-scanner",
  "password-security": "/dashboard/password-center",
  "account-exposure": "/dashboard/breach-checker",
  privacy: "/dashboard/resume-scanner",
  "phishing-awareness": "/dashboard/email-scanner",
  education: "/dashboard/learning-hub",
};

const PRIORITY_ORDER: Record<SecurityRecommendation["priority"], number> = { high: 0, medium: 1, low: 2 };
const MAX_RECOMMENDATIONS = 5;

/**
 * Builds "Your Top Security Priorities" directly from each category's
 * own computed result — never invents a recommendation a category's
 * data doesn't support. A category with no data yet gets a gentle
 * "get started" nudge (low priority) rather than being treated as a problem.
 */
export function generateSecurityRecommendations(categories: SecurityCategoryResult[]): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  for (const category of categories) {
    if (!category.hasData) {
      recommendations.push({
        id: `${category.id}-get-started`,
        text: category.recommendedAction,
        reason: "You haven't used this tool yet, so this category isn't factored into your score.",
        priority: "low",
        category: category.id,
        actionHref: CATEGORY_HREF[category.id],
      });
      continue;
    }

    const score = category.score ?? 100;
    const priority: SecurityRecommendation["priority"] = score < 50 ? "high" : score < 75 ? "medium" : "low";

    // Only surface an action-worthy recommendation when the category's own data actually supports one.
    if (score < 90) {
      recommendations.push({
        id: `${category.id}-improve`,
        text: category.recommendedAction,
        reason: category.explanation,
        priority,
        category: category.id,
        actionHref: CATEGORY_HREF[category.id],
      });
    }
  }

  return recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]).slice(0, MAX_RECOMMENDATIONS);
}
