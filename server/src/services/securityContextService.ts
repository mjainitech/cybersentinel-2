import { listScansForUser } from "./scanHistoryStore";
import { listResumeReportsForUser } from "./resumeHistoryStore";
import { listEmailReportsForUser } from "./emailHistoryStore";
import { listPasswordReportsForUser } from "./passwordHistoryStore";
import { listBreachReportsForUser } from "./breachHistoryStore";
import { getUserLearningSnapshot, getLearningCompletionStats } from "./learningProgressStore";
import { getThreatEngagementStats, resolveThreatItem } from "../controllers/threatController";
import { listSnapshotsForUser } from "./securityScoreSnapshotStore";
import { buildLearningProfile } from "../utils/learningProfile";
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
import { getCategoriesWithCounts as getLearningCategoriesWithCounts } from "../data/learningContent";
import type { CoachTopic } from "../utils/aiCoachTopics";
import type { ExplainRequest } from "../types";

/**
 * Builds ONLY the context sections actually relevant to the question
 * being asked — never the user's entire history. Every value here is
 * a score, count, rating, or masked identifier already used
 * elsewhere in the app; nothing here is raw content (no email body,
 * no resume text, no password, no leaked credential). This is what
 * "GOOD: Password Security Score: 72 / BAD: the user's actual
 * password" from the spec looks like in code.
 */
export async function buildSecurityContext(userId: string, topics: CoachTopic[], explain?: ExplainRequest): Promise<string> {
  const sections: string[] = [];

  // Baseline: always include the Security Profile, since almost every
  // question benefits from knowing the user's overall standing.
  const [scans, resumeReports, emailReports, passwordReports, breachReports, learningStats] = await Promise.all([
    listScansForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listResumeReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listEmailReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listPasswordReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    listBreachReportsForUser(userId, { sortBy: "date", sortDir: "desc" }).catch(() => []),
    getLearningCompletionStats(userId).catch(() => null),
  ]);

  const totalAvailableLessons = getLearningCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);

  const categories = [
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

  const { overallScore, grade } = calculateOverallScore(categories);
  sections.push(
    `Security Profile:\nOverall Score: ${overallScore !== null ? `${overallScore}/100 (Grade ${grade})` : "Not enough data yet"}`
  );

  const byId = (id: string) => categories.find((c) => c.id === id);
  const includeTopic = (topic: CoachTopic) => topics.includes(topic) || explain?.kind === mapTopicToExplainKind(topic);

  if (includeTopic("password")) {
    const cat = byId("password-security");
    sections.push(
      `Password Security:\nScore: ${cat?.hasData ? `${cat.score}/100` : "No data yet"}\nAssessments completed: ${passwordReports.length}`
    );
  }

  if (includeTopic("phishing")) {
    const cat = byId("phishing-awareness");
    const suspicious = emailReports.filter((r) => r.classification === "suspicious" || r.classification === "likely-phishing").length;
    sections.push(
      `Phishing Awareness:\nScore: ${cat?.hasData ? `${cat.score}/100` : "No data yet"}\nEmails analyzed: ${emailReports.length}\nFlagged as suspicious/likely phishing: ${suspicious}`
    );
  }

  if (includeTopic("privacy")) {
    const cat = byId("privacy");
    sections.push(`Privacy:\nScore: ${cat?.hasData ? `${cat.score}/100` : "No data yet"}\nResume scans: ${resumeReports.length}`);
  }

  if (includeTopic("website")) {
    const cat = byId("website-security");
    sections.push(`Website Security:\nScore: ${cat?.hasData ? `${cat.score}/100` : "No data yet"}\nWebsites scanned: ${scans.length}`);
  }

  if (includeTopic("breach")) {
    const cat = byId("account-exposure");
    const latest = breachReports[0];
    sections.push(
      `Account Exposure:\nScore: ${cat?.hasData ? `${cat.score}/100` : "No data yet"}\nMost recent check: ${
        latest ? `${latest.maskedEmail}, risk level: ${latest.riskLevel}, ${latest.breachCount} known breach(es)` : "None yet"
      }`
    );
  }

  if (includeTopic("learning")) {
    const snapshot = await getUserLearningSnapshot(userId).catch(() => null);
    const profile = snapshot
      ? buildLearningProfile(snapshot.totalXp, snapshot.progress, snapshot.quizAttempts, snapshot.streak)
      : null;
    sections.push(
      `Learning:\n${
        profile
          ? `${profile.completionPercent}% complete, Level ${profile.level} (${profile.levelTitle}), ${profile.streak.currentStreak}-day streak`
          : "No learning activity yet"
      }`
    );
  }

  if (includeTopic("threat")) {
    const stats = await getThreatEngagementStats(userId).catch(() => ({ threatsViewed: 0, threatsBookmarked: 0 }));
    sections.push(`Threat Intelligence Activity:\nThreats viewed: ${stats.threatsViewed}, bookmarked: ${stats.threatsBookmarked}`);
  }

  if (includeTopic("analytics")) {
    const snapshots = await listSnapshotsForUser(userId).catch(() => []);
    const scored = snapshots.filter((s) => s.overallScore !== null);
    if (scored.length >= 2) {
      const first = scored[0];
      const last = scored[scored.length - 1];
      sections.push(
        `Security Score Trend:\nChanged from ${first.overallScore} to ${last.overallScore} (from ${first.date} to ${last.date})`
      );
    } else {
      sections.push("Security Score Trend:\nNot enough historical data yet to show a trend.");
    }
  }

  // A specific threat/CVE the user is asking about via an "Explain" button — verified data only, never invented.
  if (explain?.kind === "threat" && explain.threatId) {
    const item = await resolveThreatItem(explain.threatId).catch(() => null);
    if (item) {
      const title = item.kind === "curated" ? item.title : item.id;
      const description = item.kind === "curated" ? item.fullDescription : item.description;
      sections.push(`Specific Threat Being Discussed:\nTitle: ${title}\nSeverity: ${item.severity}\nVerified description: ${description}`);
    }
  }

  const recommendations = generateSecurityRecommendations(categories);
  if (recommendations.length > 0) {
    sections.push(`Recent Recommendation:\n${recommendations[0].text} — ${recommendations[0].reason}`);
  }

  return sections.join("\n\n");
}

function mapTopicToExplainKind(topic: CoachTopic): ExplainRequest["kind"] | null {
  const map: Partial<Record<CoachTopic, ExplainRequest["kind"]>> = {
    password: "password-score",
    phishing: "phishing-result",
    privacy: "privacy-result",
    website: "website-scan",
    breach: "breach-result",
    analytics: "analytics-trend",
    threat: "threat",
  };
  return map[topic] ?? null;
}
