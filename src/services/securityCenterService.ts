import { authHeader } from "@/services/authToken";
import type { AiExplanation } from "@/services/scanService";

export type SecurityGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export type SecurityCategoryId =
  | "website-security"
  | "password-security"
  | "account-exposure"
  | "privacy"
  | "phishing-awareness"
  | "education";

export interface SecurityCategoryResult {
  id: SecurityCategoryId;
  title: string;
  hasData: boolean;
  score: number | null;
  status: "excellent" | "good" | "fair" | "needs-attention" | "no-data";
  explanation: string;
  recommendedAction: string;
  stats: Record<string, string | number | null>;
}

export interface SecurityRecommendation {
  id: string;
  text: string;
  reason: string;
  priority: "low" | "medium" | "high";
  category: SecurityCategoryId;
  actionHref?: string;
}

export type SecurityActivityType =
  | "website-scan"
  | "resume-analysis"
  | "phishing-analysis"
  | "password-assessment"
  | "breach-check";

export interface SecurityTimelineEntry {
  type: SecurityActivityType;
  date: string;
  label: string;
  result: string;
  riskLevel?: "safe" | "caution" | "risk";
}

export interface SecurityTrendSeries {
  category: SecurityCategoryId;
  label: string;
  points: { date: string; score: number }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface SecurityProfileReport {
  generatedAt: string;
  overallScore: number | null;
  grade: SecurityGrade | null;
  categoriesWithData: number;
  scoringMethodology: string[];
  categories: SecurityCategoryResult[];
  recommendations: SecurityRecommendation[];
  timeline: SecurityTimelineEntry[];
  trends: SecurityTrendSeries[];
  achievements: Achievement[];
  aiSummary: AiExplanation;
  isNewUser: boolean;
}

export interface SecurityProfileResponse {
  profile: SecurityProfileReport;
  cached: boolean;
  partial?: boolean;
  partialMessage?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export const CATEGORY_ROUTE: Record<SecurityCategoryId, string | undefined> = {
  "website-security": "/dashboard/url-scanner",
  "password-security": "/dashboard/password-center",
  "account-exposure": "/dashboard/breach-checker",
  privacy: "/dashboard/resume-scanner",
  "phishing-awareness": "/dashboard/email-scanner",
  education: "/dashboard/learning-hub",
};

export async function getSecurityProfile(forceRefresh = false): Promise<SecurityProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/security-center/profile${forceRefresh ? "?refresh=true" : ""}`, {
    headers: { ...authHeader() },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Some security information is temporarily unavailable.");
  }

  return response.json();
}
