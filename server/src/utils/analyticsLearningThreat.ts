import type { LearningProfile, LearningAnalytics, ThreatIntelAnalytics, ThreatHistoryRecord } from "../types";

/**
 * Reuses the Learning Hub's own LearningProfile and completion-stats
 * (the same ones the Security Center's Education category already
 * consumes) — this is not a second progress-tracking system, just a
 * reshaping of the same real data for the analytics view.
 */
export function buildLearningAnalytics(profile: LearningProfile, averageQuizScore: number | null): LearningAnalytics {
  const categoriesCompleted = profile.categoryProgress.filter((c) => c.total > 0 && c.completed === c.total).length;

  return {
    lessonsCompleted: profile.lessonsCompleted,
    quizCompletionRate:
      profile.totalAvailableLessons > 0 ? Math.round((profile.quizzesCompleted / profile.totalAvailableLessons) * 100) : null,
    averageQuizScore,
    xpEarned: profile.totalXp,
    currentLevel: profile.level,
    levelTitle: profile.levelTitle,
    currentStreak: profile.streak.currentStreak,
    categoriesCompleted,
    totalCategories: profile.categoryProgress.length,
  };
}

/** Reuses the Threat Intelligence Dashboard's own bookmark/history stores — no new tracking system. */
export function buildThreatIntelAnalytics(
  threatsViewed: number,
  threatsBookmarked: number,
  history: ThreatHistoryRecord[]
): ThreatIntelAnalytics {
  const categoryCounts = history.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.threatKind === "cve" ? "vulnerabilities" : "curated";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const mostViewedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  return { threatsViewed, threatsBookmarked, mostViewedCategories };
}
