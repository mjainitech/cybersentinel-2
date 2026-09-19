import type { SecurityTrendSeries, SecurityImprovementItem, LearningProfile } from "../types";

/** Below this many points, splitting a trend in half wouldn't produce a meaningful comparison. */
const MIN_POINTS_FOR_COMPARISON = 4;

const CATEGORY_PHRASE: Record<string, string> = {
  "website-security": "website security score",
  "password-security": "password security score",
  privacy: "privacy score",
  "phishing-awareness": "phishing-awareness score",
};

function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function compareTrend(series: SecurityTrendSeries): SecurityImprovementItem | null {
  if (series.points.length < MIN_POINTS_FOR_COMPARISON) return null;

  const midpoint = Math.ceil(series.points.length / 2);
  const earlierAvg = average(series.points.slice(0, midpoint).map((p) => p.score));
  const recentAvg = average(series.points.slice(midpoint).map((p) => p.score));
  const delta = Math.round(recentAvg - earlierAvg);

  const phrase = CATEGORY_PHRASE[series.category] ?? series.label;

  // A change smaller than this is treated as noise, not a real trend — avoids exaggerating small fluctuations.
  if (Math.abs(delta) < 3) {
    return { text: `Your ${phrase} has stayed about the same.`, direction: "no-change" };
  }

  return delta > 0
    ? { text: `Your ${phrase} improved by ${delta} points.`, direction: "improved" }
    : { text: `Your ${phrase} declined by ${Math.abs(delta)} points.`, direction: "declined" };
}

export function buildSecurityImprovements(
  categoryTrends: SecurityTrendSeries[],
  checksThisPeriod: number,
  checksPreviousPeriod: number,
  learningProfile: LearningProfile | null
): SecurityImprovementItem[] {
  const improvements: SecurityImprovementItem[] = [];

  for (const trend of categoryTrends) {
    const result = compareTrend(trend);
    if (result) improvements.push(result);
  }

  if (checksPreviousPeriod > 0) {
    if (checksThisPeriod > checksPreviousPeriod) {
      improvements.push({ text: "You've completed more security checks than in the previous period.", direction: "improved" });
    } else if (checksThisPeriod < checksPreviousPeriod) {
      improvements.push({ text: "You've completed fewer security checks than in the previous period.", direction: "declined" });
    }
  }

  if (learningProfile && learningProfile.lessonsCompleted > 0) {
    improvements.push({ text: "Your learning progress increased.", direction: "improved" });
  }

  return improvements;
}
