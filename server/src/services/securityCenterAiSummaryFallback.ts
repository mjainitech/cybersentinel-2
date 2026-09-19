import type { AiExplanation, SecurityCategoryResult } from "../types";

export function buildFallbackSecuritySummary(
  categories: SecurityCategoryResult[],
  overallScore: number | null
): AiExplanation {
  const scored = categories.filter((c) => c.hasData);

  if (scored.length === 0) {
    return {
      verdict: "Your Security Profile is just getting started.",
      reasons: ["You haven't completed any security checks yet, so there's nothing to summarize."],
      risks: [],
      nextSteps: ["Try running a website scan, a password check, or a breach check to begin building your profile."],
      generatedByAi: false,
    };
  }

  const strong = scored.filter((c) => (c.score ?? 0) >= 80).map((c) => c.title);
  const weak = scored.filter((c) => (c.score ?? 0) < 60).map((c) => c.title);

  const verdict =
    overallScore !== null
      ? `Your CyberSentinel Security Profile currently scores ${overallScore}/100 across ${scored.length} categor${scored.length === 1 ? "y" : "ies"} with activity.`
      : "Your Security Profile doesn't have enough activity yet to calculate a score.";

  const reasons = [
    strong.length > 0 ? `You're doing well in: ${strong.join(", ")}.` : "None of your categories are scoring especially high yet.",
    weak.length > 0 ? `Areas that could use attention: ${weak.join(", ")}.` : "No categories are currently scoring low.",
  ];

  const recommendations = scored
    .filter((c) => (c.score ?? 100) < 80)
    .slice(0, 3)
    .map((c) => c.recommendedAction);

  return {
    verdict,
    reasons,
    risks: [],
    nextSteps:
      recommendations.length > 0 ? recommendations : ["Keep using CyberSentinel's tools regularly to maintain your profile."],
    generatedByAi: false,
  };
}
