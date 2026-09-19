import { authHeader } from "@/services/authToken";
import type { AiExplanation } from "@/services/scanService";
import type { SecurityCategoryResult, SecurityRecommendation, SecurityGrade, SecurityCategoryId } from "@/services/securityCenterService";

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

export const TIME_RANGE_LABELS: Record<AnalyticsTimeRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "6m": "Last 6 Months",
  "1y": "Last Year",
  all: "All Time",
};

export interface SecurityScoreSnapshot {
  id: string;
  date: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  categoryScores: Partial<Record<SecurityCategoryId, number | null>>;
}

export interface SecurityTrendSeries {
  category: SecurityCategoryId;
  label: string;
  points: { date: string; score: number }[];
}

export interface AnalyticsOverview {
  overallScore: number | null;
  scoreChange: number | null;
  totalSecurityChecks: number;
  securityChecksThisMonth: number;
  learningProgressPercent: number | null;
  openRecommendations: number;
  threatsReviewed: number;
  hasEnoughData: boolean;
}

export interface RiskDistribution {
  safe: number;
  caution: number;
  risk: number;
}

export interface WebsiteAnalytics {
  totalScanned: number;
  averageScore: number | null;
  highestRiskScan: { url: string; score: number } | null;
  lowestRiskScan: { url: string; score: number } | null;
  riskDistribution: RiskDistribution;
  trend: SecurityTrendSeries | null;
}

export interface PhishingAnalytics {
  totalAnalyzed: number;
  averageScore: number | null;
  suspiciousCount: number;
  likelyPhishingCount: number;
  riskDistribution: RiskDistribution;
  trend: SecurityTrendSeries | null;
}

export interface PasswordAnalytics {
  assessmentsCompleted: number;
  averageScore: number | null;
  trend: SecurityTrendSeries | null;
  checklistCompletionPercent: number | null;
  mfaChecked: boolean | null;
  passwordManagerChecked: boolean | null;
}

export interface PrivacyAnalytics {
  totalScans: number;
  averageScore: number | null;
  trend: SecurityTrendSeries | null;
  mostCommonFindingSummaries: string[];
}

export interface BreachAnalytics {
  totalChecks: number;
  knownExposures: number;
  mostRecentCheck: { maskedEmail: string; riskLevel: string; checkedAt: string } | null;
  exposureCategoriesSeen: number;
}

export interface LearningAnalytics {
  lessonsCompleted: number;
  quizCompletionRate: number | null;
  averageQuizScore: number | null;
  xpEarned: number;
  currentLevel: number;
  levelTitle: string;
  currentStreak: number;
  categoriesCompleted: number;
  totalCategories: number;
}

export interface ThreatIntelAnalytics {
  threatsViewed: number;
  threatsBookmarked: number;
  mostViewedCategories: { category: string; count: number }[];
}

export interface SecurityImprovementItem {
  text: string;
  direction: "improved" | "declined" | "no-change";
}

export interface AnalyticsInsight {
  text: string;
}

export interface AnalyticsDashboardResponse {
  timeRange: AnalyticsTimeRange;
  overview: AnalyticsOverview;
  overallScoreTrend: SecurityScoreSnapshot[];
  categoryTrends: SecurityTrendSeries[];
  website: WebsiteAnalytics;
  phishing: PhishingAnalytics;
  password: PasswordAnalytics;
  privacy: PrivacyAnalytics;
  breach: BreachAnalytics;
  learning: LearningAnalytics;
  threatIntel: ThreatIntelAnalytics;
  improvements: SecurityImprovementItem[];
  insights: AnalyticsInsight[];
  topPriorities: SecurityRecommendation[];
  aiSummary: AiExplanation;
  partial: boolean;
  partialMessage?: string;
}

export interface AnalyticsComparisonCategoryResult {
  category: string;
  previousValue: number | null;
  currentValue: number | null;
  direction: "improved" | "declined" | "no-change" | "not-enough-data";
}

export interface AnalyticsComparisonResponse {
  previousLabel: string;
  currentLabel: string;
  results: AnalyticsComparisonCategoryResult[];
}

export interface SecurityReportData {
  generatedAt: string;
  timeRangeLabel: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  categories: SecurityCategoryResult[];
  majorFindings: string[];
  recommendations: SecurityRecommendation[];
  learning: LearningAnalytics;
  threatIntel: ThreatIntelAnalytics;
  summary: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Some analytics are temporarily unavailable.");
  }
  return response.json();
}

export async function getAnalyticsDashboard(range: AnalyticsTimeRange): Promise<AnalyticsDashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics?range=${range}`, { headers: { ...authHeader() } });
  return handle(response);
}

export async function compareAnalyticsPeriods(
  previous: AnalyticsTimeRange,
  current: AnalyticsTimeRange
): Promise<AnalyticsComparisonResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/compare?previous=${previous}&current=${current}`, {
    headers: { ...authHeader() },
  });
  return handle(response);
}

export async function generateSecurityReport(range: AnalyticsTimeRange): Promise<SecurityReportData> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ range }),
  });
  const { report } = await handle<{ report: SecurityReportData }>(response);
  return report;
}

export async function exportSecurityReportPdf(range: AnalyticsTimeRange): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/report/export?range=${range}`, {
    headers: { ...authHeader() },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong generating that PDF.");
  }
  return response.blob();
}
