import { listScansForUser } from "./scanHistoryStore";
import { listResumeReportsForUser } from "./resumeHistoryStore";
import { listEmailReportsForUser } from "./emailHistoryStore";
import { listPasswordReportsForUser, getPasswordReportForUser } from "./passwordHistoryStore";
import { listBreachReportsForUser } from "./breachHistoryStore";
import { getUserLearningSnapshot, getLearningCompletionStats } from "./learningProgressStore";
import { getLessonsByCategory, getCategoriesWithCounts as getLearningCategoriesWithCounts } from "../data/learningContent";
import { listBookmarksForUser } from "./threatBookmarkStore";
import { listHistoryForUser as listThreatHistoryForUser } from "./threatHistoryStore";
import { resolveThreatItem } from "../controllers/threatController";
import {
  calculateWebsiteSecurityCategory,
  calculatePasswordSecurityCategory,
  calculateAccountExposureCategory,
  calculatePrivacyCategory,
  calculatePhishingAwarenessCategory,
  calculateEducationCategory,
} from "../utils/securityCategories";
import { generateSecurityRecommendations } from "../utils/securityRecommendations";
import { buildSecurityTrends } from "../utils/securityTrends";
import { buildSecurityImprovements } from "../utils/securityImprovement";
import { calculateActionPriority } from "../utils/actionPriority";
import { deduplicateActions } from "../utils/actionDeduplication";
import { getActionStatusMap } from "./actionStatusStore";
import type { SecurityAction, SecurityCategoryResult, ActionCenterResponse } from "../types";

const CATEGORY_TO_ACTION_KEY: Record<string, string> = {
  "website-security": "improve-website-security",
  "password-security": "improve-password-security",
  "account-exposure": "check-account-exposure",
  privacy: "improve-privacy",
  "phishing-awareness": "improve-phishing-awareness",
  education: "continue-education",
};

const CATEGORY_LESSON: Record<string, { lessonId: string; title: string }> = {
  "website-security": { lessonId: "website-reputation", title: "Website Reputation" },
  "password-security": { lessonId: "multi-factor-authentication", title: "Multi-Factor Authentication" },
  "account-exposure": { lessonId: "data-breaches", title: "Data Breaches" },
  privacy: { lessonId: "personally-identifiable-information", title: "Personally Identifiable Information" },
  "phishing-awareness": { lessonId: "recognizing-suspicious-messages", title: "Recognizing Suspicious Messages" },
};

const MFA_KEYWORDS = ["mfa", "multi-factor"];

function isMfaRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return MFA_KEYWORDS.some((kw) => lower.includes(kw));
}

function makeAction(partial: Omit<SecurityAction, "status" | "createdAt">): SecurityAction {
  return { ...partial, status: "not-started", createdAt: new Date().toISOString() };
}

function priorityWeight(priority: SecurityAction["priority"]): number {
  return { critical: 3, high: 2, medium: 1, low: 0 }[priority];
}

function mapSecurityCategoryToLearningCategory(categoryId: string): Parameters<typeof getLessonsByCategory>[0] {
  const map: Record<string, Parameters<typeof getLessonsByCategory>[0]> = {
    "website-security": "web-security",
    "password-security": "online-safety",
    "account-exposure": "privacy",
    privacy: "privacy",
    "phishing-awareness": "phishing-social-engineering",
  };
  return map[categoryId] ?? "fundamentals";
}

/**
 * Builds the complete, deduplicated, prioritized action list. Every
 * candidate is generated from real, already-computed data from an
 * existing system — nothing here invents a finding. Actions are
 * computed live on every request (like the Security Center's score),
 * with only the user's chosen status persisted separately.
 */
export async function buildActionCenter(userId: string): Promise<ActionCenterResponse> {
  const [scans, resumeReports, emailReports, passwordReports, breachReports, learningStats] = await Promise.all([
    listScansForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listResumeReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listEmailReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listPasswordReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listBreachReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    getLearningCompletionStats(userId).catch(() => null),
  ]);

  const isNewUser =
    scans.length === 0 && resumeReports.length === 0 && emailReports.length === 0 && passwordReports.length === 0 && breachReports.length === 0;

  const totalAvailableLessons = getLearningCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);
  const categories: SecurityCategoryResult[] = [
    calculateWebsiteSecurityCategory(scans),
    calculatePasswordSecurityCategory(passwordReports),
    calculateAccountExposureCategory(breachReports),
    calculatePrivacyCategory(resumeReports),
    calculatePhishingAwarenessCategory(emailReports),
    calculateEducationCategory({
      lessonsCompleted: learningStats?.lessonsCompleted ?? 0,
      quizzesCompleted: learningStats?.quizzesCompleted ?? 0,
      averageQuizScore: learningStats?.averageQuizScore ?? null,
      totalAvailableLessons,
    }),
  ];

  const candidates: SecurityAction[] = [];

  // --- Security Center recommendations (reused directly, not duplicated) ---
  const recommendations = generateSecurityRecommendations(categories);
  for (const rec of recommendations) {
    const category = categories.find((c) => c.id === rec.category);
    if (!category) continue;

    const mfaRelated = isMfaRelated(rec.text);
    const actionKey = mfaRelated ? "enable-mfa" : CATEGORY_TO_ACTION_KEY[rec.category] ?? `improve-${rec.category}`;
    const priority = mfaRelated
      ? calculateActionPriority({ kind: "security-checklist-item" })
      : calculateActionPriority({ kind: "category-score", score: category.hasData ? category.score! : 0 });

    const lesson = CATEGORY_LESSON[rec.category];

    candidates.push(
      makeAction({
        actionKey,
        title: rec.text,
        description: category.explanation,
        reason: rec.reason,
        priority,
        sources: ["security-center"],
        recommendedToolHref: rec.actionHref,
        relatedLessonId: lesson?.lessonId,
        relatedLessonTitle: lesson?.title,
        estimatedEffortMinutes: 10,
      })
    );
  }

  // --- Password checklist gaps (specific, not just the aggregate score) ---
  const latestPasswordSummary = passwordReports[0];
  if (latestPasswordSummary) {
    const full = await getPasswordReportForUser(userId, latestPasswordSummary.id).catch(() => undefined);
    if (full && !full.checklist.usesMfa) {
      candidates.push(
        makeAction({
          actionKey: "enable-mfa",
          title: "Enable Multi-Factor Authentication",
          description: "Your account security checklist shows multi-factor authentication (MFA) isn't enabled yet on your accounts.",
          reason:
            "MFA is one of the most effective single steps you can take — a leaked password alone usually isn't enough to break in with it enabled.",
          priority: calculateActionPriority({ kind: "security-checklist-item" }),
          sources: ["password-center"],
          recommendedToolHref: "/dashboard/password-center",
          relatedLessonId: "multi-factor-authentication",
          relatedLessonTitle: "Multi-Factor Authentication",
          estimatedEffortMinutes: 10,
        })
      );
    }
    if (full && !full.checklist.usesPasswordManager) {
      candidates.push(
        makeAction({
          actionKey: "use-password-manager",
          title: "Consider Using a Password Manager",
          description: "Your account security checklist shows you haven't marked using a password manager yet.",
          reason: "A password manager makes using a long, unique password for every account realistic.",
          priority: calculateActionPriority({ kind: "security-checklist-item" }),
          sources: ["password-center"],
          recommendedToolHref: "/dashboard/password-center",
          estimatedEffortMinutes: 15,
        })
      );
    }
  }

  // --- A recent high-risk website scan ---
  const highRiskScan = scans.find((s) => s.band === "danger");
  if (highRiskScan) {
    const websiteCategory = categories.find((c) => c.id === "website-security");
    candidates.push(
      makeAction({
        actionKey: "review-website-scan",
        title: "Review a High-Risk Website Scan",
        description: `Your scan of ${highRiskScan.url} was flagged as high risk.`,
        reason: "A recent scan result needs your attention.",
        priority: calculateActionPriority({ kind: "category-score", score: websiteCategory?.hasData ? websiteCategory.score! : 0 }),
        sources: ["website-scanner"],
        recommendedToolHref: "/dashboard/history",
        relatedLessonId: "website-reputation",
        relatedLessonTitle: "Website Reputation",
        estimatedEffortMinutes: 5,
      })
    );
  }

  // --- A recent suspicious/phishing email ---
  const suspiciousEmail = emailReports.find((r) => r.classification === "suspicious" || r.classification === "likely-phishing");
  if (suspiciousEmail) {
    const phishingCategory = categories.find((c) => c.id === "phishing-awareness");
    candidates.push(
      makeAction({
        actionKey: "review-phishing-analysis",
        title: "Review Your Recent Phishing Analysis",
        description: "A recently analyzed email was flagged as suspicious or likely phishing.",
        reason: "Reviewing what made it suspicious helps you recognize similar attempts in the future.",
        priority: calculateActionPriority({ kind: "category-score", score: phishingCategory?.hasData ? phishingCategory.score! : 0 }),
        sources: ["email-analyzer"],
        recommendedToolHref: "/dashboard/email-scanner",
        relatedLessonId: "recognizing-suspicious-messages",
        relatedLessonTitle: "Recognizing Suspicious Messages",
        estimatedEffortMinutes: 5,
      })
    );
  }

  // --- Breach exposure ---
  const latestBreachSummary = breachReports[0];
  if (latestBreachSummary && latestBreachSummary.breachCount > 0) {
    const exposureCategory = categories.find((c) => c.id === "account-exposure");
    candidates.push(
      makeAction({
        actionKey: "check-account-exposure",
        title: "Check Your Account Exposure",
        description: `Your most recent breach check found ${latestBreachSummary.breachCount} known breach(es) for ${latestBreachSummary.maskedEmail}.`,
        reason: "Known exposures mean any reused password on those accounts should be changed.",
        priority: calculateActionPriority({ kind: "category-score", score: exposureCategory?.hasData ? exposureCategory.score! : 0 }),
        sources: ["breach-checker"],
        recommendedToolHref: "/dashboard/breach-checker",
        relatedLessonId: "data-breaches",
        relatedLessonTitle: "Data Breaches",
        estimatedEffortMinutes: 10,
      })
    );
  }

  // --- Learning gap tied to the single weakest category ---
  const dataCategories = categories.filter((c) => c.hasData && c.id !== "education");
  const weakestCategory = dataCategories.length > 0 ? [...dataCategories].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0] : null;
  if (weakestCategory && (weakestCategory.score ?? 100) < 80) {
    const lessonsInCategoryGroup = getLessonsByCategory(mapSecurityCategoryToLearningCategory(weakestCategory.id)).filter(
      (l) => l.isAvailable
    );
    const snapshot = await getUserLearningSnapshot(userId).catch(() => null);
    const completedIds = new Set((snapshot?.progress ?? []).filter((p) => p.status === "completed").map((p) => p.lessonId));
    const incompleteLesson = lessonsInCategoryGroup.find((l) => !completedIds.has(l.id));

    if (incompleteLesson) {
      candidates.push(
        makeAction({
          actionKey: `learn-${incompleteLesson.id}`,
          title: `Complete the "${incompleteLesson.title}" Lesson`,
          description: `Your ${weakestCategory.title} score could benefit from this lesson.`,
          reason: `This is your lowest-scoring category right now (${weakestCategory.score}/100).`,
          priority: calculateActionPriority({ kind: "learning-gap" }),
          sources: ["learning-hub"],
          relatedLessonId: incompleteLesson.id,
          relatedLessonTitle: incompleteLesson.title,
          recommendedToolHref: "/dashboard/learning-hub",
          estimatedEffortMinutes: incompleteLesson.estimatedMinutes,
        })
      );
    }
  }

  // --- Relevant, unaddressed threats (bookmarked or recently viewed) ---
  const [bookmarks, threatHistory] = await Promise.all([
    listBookmarksForUser(userId).catch(() => []),
    listThreatHistoryForUser(userId).catch(() => []),
  ]);
  const threatIds = Array.from(
    new Set([...bookmarks.map((b) => b.threatId), ...threatHistory.slice(0, 5).map((h) => h.threatId)])
  ).slice(0, 5);
  for (const threatId of threatIds) {
    const item = await resolveThreatItem(threatId).catch(() => null);
    if (!item) continue;
    if (item.severity !== "high" && item.severity !== "critical") continue;

    const title = item.kind === "curated" ? item.title : item.id;
    candidates.push(
      makeAction({
        actionKey: `review-threat-${item.id}`,
        title: `Learn About: ${title}`,
        description: item.kind === "curated" ? item.shortDescription : item.description.slice(0, 200),
        reason: `This threat is rated ${item.severity} severity.`,
        priority: calculateActionPriority({ kind: "threat-severity", severity: item.severity }),
        sources: ["threat-intelligence"],
        relatedThreatId: item.id,
        recommendedToolHref: `/threat-intelligence/${item.id}`,
        estimatedEffortMinutes: 5,
      })
    );
  }

  // --- Declining trends from Security Analytics (reused directly) ---
  const categoryTrends = buildSecurityTrends({ scans, resumeReports, emailReports, passwordReports });
  const improvements = buildSecurityImprovements(categoryTrends, 0, 0, null);
  for (const improvement of improvements.filter((i) => i.direction === "declined")) {
    candidates.push(
      makeAction({
        actionKey: `address-decline-${improvement.text.slice(0, 40)}`,
        title: "Address a Declining Security Trend",
        description: improvement.text,
        reason: "Your Security Analytics shows this trend moving in the wrong direction recently.",
        priority: calculateActionPriority({ kind: "minor-improvement" }),
        sources: ["security-analytics"],
        recommendedToolHref: "/analytics",
        estimatedEffortMinutes: 10,
      })
    );
  }

  const deduped = deduplicateActions(candidates);

  // Attach persisted status, then keep the underlying finding intact even
  // when dismissed — dismissing only removes it from the active list here.
  const statusMap = await getActionStatusMap(userId);
  const withStatus = deduped.map((action) => ({ ...action, status: statusMap.get(action.actionKey) ?? action.status }));

  const overview = {
    critical: withStatus.filter((a) => a.priority === "critical" && a.status !== "completed" && a.status !== "dismissed").length,
    high: withStatus.filter((a) => a.priority === "high" && a.status !== "completed" && a.status !== "dismissed").length,
    recommended: withStatus.filter(
      (a) => (a.priority === "medium" || a.priority === "low") && a.status !== "completed" && a.status !== "dismissed"
    ).length,
    completed: withStatus.filter((a) => a.status === "completed").length,
  };

  const sortedActive = withStatus
    .filter((a) => a.status !== "dismissed")
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));

  return {
    overview,
    actions: sortedActive,
    isNewUser,
    partial: false,
  };
}
