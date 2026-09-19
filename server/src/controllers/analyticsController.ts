import type { Request, Response } from "express";
import { logger } from "../services/logger";
import { listScansForUser } from "../services/scanHistoryStore";
import { listResumeReportsForUser } from "../services/resumeHistoryStore";
import { listEmailReportsForUser } from "../services/emailHistoryStore";
import { listPasswordReportsForUser, getPasswordReportForUser } from "../services/passwordHistoryStore";
import { listBreachReportsForUser, getBreachReportForUser } from "../services/breachHistoryStore";
import { getUserLearningSnapshot, getLearningCompletionStats } from "../services/learningProgressStore";
import { getThreatEngagementStats } from "./threatController";
import { listHistoryForUser } from "../services/threatHistoryStore";
import { listSnapshotsForUser } from "../services/securityScoreSnapshotStore";
import { buildLearningProfile } from "../utils/learningProfile";
// Reused directly from the Security Center — never a second scoring system.
import {
  calculateWebsiteSecurityCategory,
  calculatePasswordSecurityCategory,
  calculateAccountExposureCategory,
  calculatePrivacyCategory,
  calculatePhishingAwarenessCategory,
  calculateEducationCategory,
} from "../utils/securityCategories";
import { calculateOverallScore } from "../utils/securityScore";
import { generateSecurityRecommendations } from "../utils/securityRecommendations";
import { buildSecurityTrends } from "../utils/securityTrends";
import { getCategoriesWithCounts as getLearningCategoriesWithCounts } from "../data/learningContent";

import { filterByTimeRange, getRangeStartDate, TIME_RANGE_LABELS } from "../utils/analyticsTimeRange";
import {
  buildWebsiteAnalytics,
  buildPhishingAnalytics,
  buildPasswordAnalytics,
  buildPrivacyAnalytics,
  buildBreachAnalytics,
} from "../utils/analyticsAggregation";
import { buildLearningAnalytics, buildThreatIntelAnalytics } from "../utils/analyticsLearningThreat";
import { buildAnalyticsOverview } from "../utils/analyticsOverview";
import { buildSecurityImprovements } from "../utils/securityImprovement";
import { buildSecurityInsights } from "../utils/securityInsights";
import { compareValue } from "../utils/analyticsComparison";
import { getAnalyticsAiSummary } from "../services/analyticsAiSummary";
import { generateSecurityReportPdf } from "../services/analyticsReportPdf";
import { createNotification } from "../services/notificationStore";
import type {
  AnalyticsTimeRange,
  AnalyticsDashboardResponse,
  ScanHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
  PasswordHistorySummary,
  BreachHistorySummary,
  SecurityReportData,
} from "../types";

const VALID_RANGES: AnalyticsTimeRange[] = ["7d", "30d", "90d", "6m", "1y", "all"];

function parseRange(value: unknown): AnalyticsTimeRange {
  return typeof value === "string" && VALID_RANGES.includes(value as AnalyticsTimeRange) ? (value as AnalyticsTimeRange) : "30d";
}

interface RawHistories {
  scans: ScanHistorySummary[] | null;
  resumeReports: ResumeReportSummary[] | null;
  emailReports: EmailHistorySummary[] | null;
  passwordReports: PasswordHistorySummary[] | null;
  breachReports: BreachHistorySummary[] | null;
}

/**
 * Fetches every feature's FULL history once. The underlying stores
 * are local JSON files without server-side date-range query support
 * (adding that would mean touching stores the spec says not to
 * rebuild), so time-range filtering happens here, in memory, on
 * already-fetched data — not via a second round-trip per range change.
 */
async function fetchRawHistories(userId: string): Promise<RawHistories> {
  const [scans, resumeReports, emailReports, passwordReports, breachReports] = await Promise.all([
    listScansForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((e) => {
      logger.error("Analytics: failed to load scan history", { error: String(e) });
      return null;
    }),
    listResumeReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((e) => {
      logger.error("Analytics: failed to load resume history", { error: String(e) });
      return null;
    }),
    listEmailReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((e) => {
      logger.error("Analytics: failed to load email history", { error: String(e) });
      return null;
    }),
    listPasswordReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((e) => {
      logger.error("Analytics: failed to load password history", { error: String(e) });
      return null;
    }),
    listBreachReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch((e) => {
      logger.error("Analytics: failed to load breach history", { error: String(e) });
      return null;
    }),
  ]);

  return { scans, resumeReports, emailReports, passwordReports, breachReports };
}

function filterAll(raw: RawHistories, range: AnalyticsTimeRange, now: Date = new Date()) {
  return {
    scans: filterByTimeRange(raw.scans ?? [], (s) => s.scannedAt, range, now),
    resumeReports: filterByTimeRange(raw.resumeReports ?? [], (r) => r.analyzedAt, range, now),
    emailReports: filterByTimeRange(raw.emailReports ?? [], (r) => r.analyzedAt, range, now),
    passwordReports: filterByTimeRange(raw.passwordReports ?? [], (r) => r.analyzedAt, range, now),
    breachReports: filterByTimeRange(raw.breachReports ?? [], (r) => r.checkedAt, range, now),
  };
}

export async function getAnalyticsDashboard(req: Request, res: Response) {
  const userId = req.userId!;
  const range = parseRange(req.query.range);

  try {
    const raw = await fetchRawHistories(userId);
    const anySourceFailed = Object.values(raw).some((r) => r === null);

    const now = new Date();
    const filtered = filterAll(raw, range, now);

    // Previous equivalent period, for "checks this period vs. last period" comparisons.
    const rangeStart = getRangeStartDate(range, now);
    const previous = rangeStart
      ? filterAll(raw, range, rangeStart)
      : { scans: [], resumeReports: [], emailReports: [], passwordReports: [], breachReports: [] };

    const categories = [
      calculateWebsiteSecurityCategory(filtered.scans),
      calculatePasswordSecurityCategory(filtered.passwordReports),
      calculateAccountExposureCategory(filtered.breachReports),
      calculatePrivacyCategory(filtered.resumeReports),
      calculatePhishingAwarenessCategory(filtered.emailReports),
    ];

    const learningStats = await getLearningCompletionStats(userId).catch((e) => {
      logger.error("Analytics: failed to load learning stats", { error: String(e) });
      return null;
    });
    const totalAvailableLessons = getLearningCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);
    const educationCategory = calculateEducationCategory({
      lessonsCompleted: learningStats?.lessonsCompleted ?? 0,
      quizzesCompleted: learningStats?.quizzesCompleted ?? 0,
      averageQuizScore: learningStats?.averageQuizScore ?? null,
      totalAvailableLessons,
    });
    categories.push(educationCategory);

    const { overallScore } = calculateOverallScore(categories);

    const categoryTrends = buildSecurityTrends({
      scans: filtered.scans,
      resumeReports: filtered.resumeReports,
      emailReports: filtered.emailReports,
      passwordReports: filtered.passwordReports,
    });

    const topPriorities = generateSecurityRecommendations(categories);

    // One extra, bounded fetch (the single most recent record) for the
    // two fields the lightweight summaries don't carry — not a fetch
    // of every record, which the spec explicitly warns against.
    const latestPasswordSummary = filtered.passwordReports[0];
    let latestChecklist: { usesMfa: boolean; usesPasswordManager: boolean } | null = null;
    if (latestPasswordSummary) {
      const full = await getPasswordReportForUser(userId, latestPasswordSummary.id).catch(() => undefined);
      if (full) latestChecklist = { usesMfa: full.checklist.usesMfa, usesPasswordManager: full.checklist.usesPasswordManager };
    }

    const latestBreachSummary = filtered.breachReports[0];
    let latestExposureCategoryCount: number | null = null;
    if (latestBreachSummary) {
      const full = await getBreachReportForUser(userId, latestBreachSummary.id).catch(() => undefined);
      if (full) latestExposureCategoryCount = full.report.categoriesFound.length;
    }

    const website = buildWebsiteAnalytics(filtered.scans);
    const phishing = buildPhishingAnalytics(filtered.emailReports);
    const password = buildPasswordAnalytics(filtered.passwordReports, latestChecklist);
    const privacy = buildPrivacyAnalytics(filtered.resumeReports);
    const breach = buildBreachAnalytics(filtered.breachReports, latestExposureCategoryCount);

    const learningSnapshot = await getUserLearningSnapshot(userId).catch(() => null);
    const learningProfile = learningSnapshot
      ? buildLearningProfile(learningSnapshot.totalXp, learningSnapshot.progress, learningSnapshot.quizAttempts, learningSnapshot.streak)
      : null;
    const learning = buildLearningAnalytics(
      learningProfile ?? {
        totalXp: 0,
        level: 1,
        levelTitle: "Cybersecurity Beginner",
        xpForNextLevel: null,
        xpIntoCurrentLevel: 0,
        xpNeededForNextLevel: null,
        lessonsCompleted: 0,
        totalAvailableLessons,
        completionPercent: 0,
        quizzesCompleted: 0,
        achievementsEarned: 0,
        streak: { currentStreak: 0, longestStreak: 0, lastActivityDate: null, activityDates: [] },
        categoryProgress: [],
      },
      learningStats?.averageQuizScore ?? null
    );

    const threatStats = await getThreatEngagementStats(userId).catch(() => ({ threatsViewed: 0, threatsBookmarked: 0 }));
    const threatHistory = await listHistoryForUser(userId).catch(() => []);
    const threatIntel = buildThreatIntelAnalytics(threatStats.threatsViewed, threatStats.threatsBookmarked, threatHistory);

    const totalSecurityChecks =
      filtered.scans.length +
      filtered.resumeReports.length +
      filtered.emailReports.length +
      filtered.passwordReports.length +
      filtered.breachReports.length;

    const thisMonth = filterAll(raw, "30d", now);
    const checksThisMonth =
      thisMonth.scans.length + thisMonth.resumeReports.length + thisMonth.emailReports.length + thisMonth.passwordReports.length + thisMonth.breachReports.length;

    const previousPeriodChecks =
      previous.scans.length + previous.resumeReports.length + previous.emailReports.length + previous.passwordReports.length + previous.breachReports.length;

    const snapshots = await listSnapshotsForUser(userId, rangeStart ?? undefined).catch(() => []);

    const improvements = buildSecurityImprovements(categoryTrends, totalSecurityChecks, previousPeriodChecks, learningProfile);
    const insights = buildSecurityInsights({ website, phishing, password, privacy, breach, learning });
    const overview = buildAnalyticsOverview(
      snapshots,
      totalSecurityChecks,
      checksThisMonth,
      learningProfile?.completionPercent ?? null,
      topPriorities,
      threatIntel.threatsViewed
    );

    const aiSummary = await getAnalyticsAiSummary(overallScore, improvements, insights, topPriorities);

    const response: AnalyticsDashboardResponse = {
      timeRange: range,
      overview,
      overallScoreTrend: snapshots,
      categoryTrends,
      website,
      phishing,
      password,
      privacy,
      breach,
      learning,
      threatIntel,
      improvements,
      insights,
      topPriorities,
      aiSummary,
      partial: anySourceFailed,
      partialMessage: anySourceFailed ? "Some analytics are temporarily unavailable." : undefined,
    };

    return res.json(response);
  } catch (error) {
    logger.error("Failed to build analytics dashboard", { error: String(error) });
    return res.status(500).json({ error: "Some analytics are temporarily unavailable. Please try again." });
  }
}

export async function compareAnalyticsPeriods(req: Request, res: Response) {
  const userId = req.userId!;
  const rangeA = parseRange(req.query.previous ?? "30d");
  const rangeB = parseRange(req.query.current ?? "30d");

  try {
    const raw = await fetchRawHistories(userId);
    const now = new Date();

    // "Previous 30 days" means the 30 days before the current 30-day window, not the same window twice.
    const currentStart = getRangeStartDate(rangeB, now) ?? new Date(0);
    const previousFiltered = filterAll(raw, rangeA, currentStart);
    const currentFiltered = filterAll(raw, rangeB, now);

    const buildCategories = (data: ReturnType<typeof filterAll>) => [
      calculateWebsiteSecurityCategory(data.scans),
      calculatePasswordSecurityCategory(data.passwordReports),
      calculatePrivacyCategory(data.resumeReports),
      calculatePhishingAwarenessCategory(data.emailReports),
    ];

    const previousCategories = buildCategories(previousFiltered);
    const currentCategories = buildCategories(currentFiltered);

    const previousOverall = calculateOverallScore(previousCategories).overallScore;
    const currentOverall = calculateOverallScore(currentCategories).overallScore;

    const results = [
      compareValue("Security Score", previousOverall, currentOverall),
      ...previousCategories.map((cat, i) =>
        compareValue(cat.title, cat.hasData ? cat.score : null, currentCategories[i].hasData ? currentCategories[i].score : null)
      ),
    ];

    return res.json({
      previousLabel: `Previous ${TIME_RANGE_LABELS[rangeA]}`,
      currentLabel: TIME_RANGE_LABELS[rangeB],
      results,
    });
  } catch (error) {
    logger.error("Failed to compare analytics periods", { error: String(error) });
    return res.status(500).json({ error: "Some analytics are temporarily unavailable. Please try again." });
  }
}

async function buildReportData(userId: string, range: AnalyticsTimeRange): Promise<SecurityReportData> {
  const raw = await fetchRawHistories(userId);
  const now = new Date();
  const filtered = filterAll(raw, range, now);

  const categories = [
    calculateWebsiteSecurityCategory(filtered.scans),
    calculatePasswordSecurityCategory(filtered.passwordReports),
    calculateAccountExposureCategory(filtered.breachReports),
    calculatePrivacyCategory(filtered.resumeReports),
    calculatePhishingAwarenessCategory(filtered.emailReports),
  ];

  const learningStats = await getLearningCompletionStats(userId).catch(() => null);
  const totalAvailableLessons = getLearningCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);
  categories.push(
    calculateEducationCategory({
      lessonsCompleted: learningStats?.lessonsCompleted ?? 0,
      quizzesCompleted: learningStats?.quizzesCompleted ?? 0,
      averageQuizScore: learningStats?.averageQuizScore ?? null,
      totalAvailableLessons,
    })
  );

  const { overallScore, grade } = calculateOverallScore(categories);
  const recommendations = generateSecurityRecommendations(categories);

  const majorFindings = categories
    .filter((c) => c.hasData && (c.status === "needs-attention" || c.status === "fair"))
    .map((c) => c.explanation);

  const learningSnapshot = await getUserLearningSnapshot(userId).catch(() => null);
  const learningProfile = learningSnapshot
    ? buildLearningProfile(learningSnapshot.totalXp, learningSnapshot.progress, learningSnapshot.quizAttempts, learningSnapshot.streak)
    : null;
  const learning = buildLearningAnalytics(
    learningProfile ?? {
      totalXp: 0,
      level: 1,
      levelTitle: "Cybersecurity Beginner",
      xpForNextLevel: null,
      xpIntoCurrentLevel: 0,
      xpNeededForNextLevel: null,
      lessonsCompleted: 0,
      totalAvailableLessons,
      completionPercent: 0,
      quizzesCompleted: 0,
      achievementsEarned: 0,
      streak: { currentStreak: 0, longestStreak: 0, lastActivityDate: null, activityDates: [] },
      categoryProgress: [],
    },
    learningStats?.averageQuizScore ?? null
  );

  const threatStats = await getThreatEngagementStats(userId).catch(() => ({ threatsViewed: 0, threatsBookmarked: 0 }));
  const threatHistory = await listHistoryForUser(userId).catch(() => []);
  const threatIntel = buildThreatIntelAnalytics(threatStats.threatsViewed, threatStats.threatsBookmarked, threatHistory);

  const summary =
    overallScore !== null
      ? `Over ${TIME_RANGE_LABELS[range]}, your CyberSentinel Security Profile scored ${overallScore}/100 (${grade}).`
      : `Not enough data yet over ${TIME_RANGE_LABELS[range]} to calculate a security score.`;

  return {
    generatedAt: new Date().toISOString(),
    timeRangeLabel: TIME_RANGE_LABELS[range],
    overallScore,
    grade,
    categories,
    majorFindings,
    recommendations,
    learning,
    threatIntel,
    summary,
  };
}

export async function generateReport(req: Request, res: Response) {
  try {
    const range = parseRange(req.body?.range ?? req.query.range);
    const report = await buildReportData(req.userId!, range);

    createNotification(req.userId!, {
      category: "system",
      title: "Security Report Generated",
      description: `Your security report for ${report.timeRangeLabel} is ready.`,
      relatedPage: "/analytics",
    }).catch((error) => logger.error("Failed to create report-generated notification", { error: String(error) }));

    return res.json({ report });
  } catch (error) {
    logger.error("Failed to generate security report", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating your report. Please try again." });
  }
}

export async function exportReportPdf(req: Request, res: Response) {
  try {
    const range = parseRange(req.query.range);
    const report = await buildReportData(req.userId!, range);
    const pdfBuffer = await generateSecurityReportPdf(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="cybersentinel-security-report-${range}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export security report PDF", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}
