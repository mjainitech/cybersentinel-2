import type { Request, Response } from "express";
import { logger } from "../services/logger";
import { TTLCache } from "../services/cache";
import { listScansForUser } from "../services/scanHistoryStore";
import { listResumeReportsForUser } from "../services/resumeHistoryStore";
import { listEmailReportsForUser } from "../services/emailHistoryStore";
import { listPasswordReportsForUser } from "../services/passwordHistoryStore";
import { listBreachReportsForUser } from "../services/breachHistoryStore";
import { getLearningCompletionStats } from "../services/learningProgressStore";
import { getCategoriesWithCounts as getLearningCategoriesWithCounts } from "../data/learningContent";
import { getThreatEngagementStats } from "./threatController";
import { recordScoreSnapshot, listSnapshotsForUser } from "../services/securityScoreSnapshotStore";
import { createNotification } from "../services/notificationStore";
import {
  calculateWebsiteSecurityCategory,
  calculatePasswordSecurityCategory,
  calculateAccountExposureCategory,
  calculatePrivacyCategory,
  calculatePhishingAwarenessCategory,
  calculateEducationCategory,
} from "../utils/securityCategories";
import { calculateOverallScore } from "../utils/securityScore";
import { calculateAchievements } from "../utils/securityAchievements";
import { generateSecurityRecommendations } from "../utils/securityRecommendations";
import { buildSecurityTimeline } from "../utils/securityTimeline";
import { buildSecurityTrends } from "../utils/securityTrends";
import { getSecurityCenterAiSummary } from "../services/securityCenterAiSummary";
import type { SecurityProfileReport } from "../types";

// Aggregation reads five local JSON stores and (at most) makes one AI
// call — never re-runs a scan or calls any external security API.
// Still, computing this on every dashboard visit would mean an AI
// call every time, so results are cached briefly per user.
const profileCache = new TTLCache<SecurityProfileReport>(3 * 60 * 1000);

export async function getSecurityProfile(req: Request, res: Response) {
  const userId = req.userId!;
  const forceRefresh = req.query.refresh === "true";

  if (!forceRefresh) {
    const cached = profileCache.get(userId);
    if (cached) return res.json({ profile: cached.value, cached: true });
  }

  try {
    // Each of these is a local read of a JSON store — no external API calls.
    const [scans, resumeReports, emailReports, passwordReports, breachReports, learningStats, threatStats] = await Promise.all([
      listScansForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((error) => {
        logger.error("Security Center: failed to load scan history", { error: String(error) });
        return null;
      }),
      listResumeReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((error) => {
        logger.error("Security Center: failed to load resume history", { error: String(error) });
        return null;
      }),
      listEmailReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((error) => {
        logger.error("Security Center: failed to load email history", { error: String(error) });
        return null;
      }),
      listPasswordReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((error) => {
        logger.error("Security Center: failed to load password history", { error: String(error) });
        return null;
      }),
      listBreachReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((error) => {
        logger.error("Security Center: failed to load breach history", { error: String(error) });
        return null;
      }),
      getLearningCompletionStats(userId).catch((error) => {
        logger.error("Security Center: failed to load learning stats", { error: String(error) });
        return null;
      }),
      getThreatEngagementStats(userId).catch((error) => {
        logger.error("Security Center: failed to load threat intelligence stats", { error: String(error) });
        return null;
      }),
    ]);

    const anySourceFailed = [scans, resumeReports, emailReports, passwordReports, breachReports, learningStats, threatStats].some(
      (r) => r === null
    );

    const totalAvailableLessons = getLearningCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);

    const categories = [
      calculateWebsiteSecurityCategory(scans ?? []),
      calculatePasswordSecurityCategory(passwordReports ?? []),
      calculateAccountExposureCategory(breachReports ?? []),
      calculatePrivacyCategory(resumeReports ?? []),
      calculatePhishingAwarenessCategory(emailReports ?? []),
      calculateEducationCategory({
        lessonsCompleted: learningStats?.lessonsCompleted ?? 0,
        quizzesCompleted: learningStats?.quizzesCompleted ?? 0,
        averageQuizScore: learningStats?.averageQuizScore ?? null,
        totalAvailableLessons,
      }),
    ];

    const { overallScore, grade, categoriesWithData, scoringMethodology } = calculateOverallScore(categories);

    const achievements = calculateAchievements({
      websiteScans: scans?.length ?? 0,
      resumeReports: resumeReports?.length ?? 0,
      emailReports: emailReports?.length ?? 0,
      passwordReports: passwordReports?.length ?? 0,
      breachChecks: breachReports?.length ?? 0,
      lessonsCompleted: learningStats?.lessonsCompleted ?? 0,
    });

    const recommendations = generateSecurityRecommendations(categories);

    const timeline = buildSecurityTimeline({
      scans: scans ?? [],
      resumeReports: resumeReports ?? [],
      emailReports: emailReports ?? [],
      passwordReports: passwordReports ?? [],
      breachReports: breachReports ?? [],
    });

    const trends = buildSecurityTrends({
      scans: scans ?? [],
      resumeReports: resumeReports ?? [],
      emailReports: emailReports ?? [],
      passwordReports: passwordReports ?? [],
    });

    const aiSummary = await getSecurityCenterAiSummary(categories, overallScore);

    const isNewUser = categoriesWithData === 0;

    const profile: SecurityProfileReport = {
      generatedAt: new Date().toISOString(),
      overallScore,
      grade,
      categoriesWithData,
      scoringMethodology,
      categories,
      recommendations,
      timeline,
      trends,
      achievements,
      aiSummary,
      isNewUser,
      threatIntelligence: threatStats ?? { threatsViewed: 0, threatsBookmarked: 0 },
    };

    profileCache.set(userId, profile);

    // Side effect only — never changes what this endpoint returns. This is
    // what lets the Analytics Center show an honest score-over-time trend
    // later, since the Security Center itself only computes a live score.
    const previousSnapshots = await listSnapshotsForUser(userId).catch(() => []);
    const priorScored = previousSnapshots.filter((s) => s.overallScore !== null);
    const priorScore = priorScored.length > 0 ? priorScored[priorScored.length - 1].overallScore : null;

    recordScoreSnapshot(userId, overallScore, grade, categories).catch((error) => {
      logger.error("Failed to record security score snapshot", { userId, error: String(error) });
    });

    // Only notify on a real, meaningful improvement (never invented, never
    // noise from a 1-2 point fluctuation) — and only if there was already a
    // prior snapshot to compare against, so a brand-new user's first score
    // never gets misreported as an "improvement" from nothing.
    if (priorScore !== null && overallScore !== null && overallScore - priorScore >= 5) {
      createNotification(userId, {
        category: "security",
        title: "Security Score Improved",
        description: `Your Security Profile score improved from ${priorScore} to ${overallScore}.`,
        relatedPage: "/dashboard/security-score",
      }).catch((error) => logger.error("Failed to create score-improvement notification", { error: String(error) }));
    }

    return res.json({
      profile,
      cached: false,
      partial: anySourceFailed,
      partialMessage: anySourceFailed ? "Some security information is temporarily unavailable." : undefined,
    });
  } catch (error) {
    logger.error("Unexpected error building security profile", { error: String(error) });
    return res.status(500).json({ error: "Some security information is temporarily unavailable. Please try again." });
  }
}
