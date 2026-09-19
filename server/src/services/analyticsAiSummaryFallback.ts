import type { AiExplanation, SecurityImprovementItem, AnalyticsInsight, SecurityRecommendation } from "../types";

export function buildFallbackAnalyticsSummary(
  overallScore: number | null,
  improvements: SecurityImprovementItem[],
  _insights: AnalyticsInsight[],
  topPriorities: SecurityRecommendation[]
): AiExplanation {
  const improved = improvements.filter((i) => i.direction === "improved");
  const declined = improvements.filter((i) => i.direction === "declined");

  const verdict =
    overallScore !== null
      ? `Your CyberSentinel Security Profile currently scores ${overallScore}/100.`
      : "You don't have enough activity yet to calculate a security score.";

  const reasons = [
    improved.length > 0 ? `Improvements: ${improved.map((i) => i.text).join(" ")}` : "No clear improvements detected yet.",
    declined.length > 0 ? `Areas that declined: ${declined.map((i) => i.text).join(" ")}` : "Nothing has declined recently.",
  ];

  const recommendations =
    topPriorities.length > 0
      ? topPriorities.slice(0, 3).map((p) => p.text)
      : ["Keep using CyberSentinel's tools regularly to build a fuller picture over time."];

  return {
    verdict,
    reasons,
    risks: [],
    nextSteps: recommendations,
    generatedByAi: false,
  };
}
