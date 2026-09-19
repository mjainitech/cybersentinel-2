import { authHeader } from "@/services/authToken";
import type { AiExplanation } from "@/services/scanService";

export type ExposureCategory = "email" | "password" | "phone" | "name" | "location" | "username" | "ip-address" | "other";

export interface BreachRecord {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  exposedCategories: ExposureCategory[];
  isPasswordExposed: boolean;
  isSensitive: boolean;
}

export type ExposureRiskLevel = "low" | "moderate" | "high" | "severe";

export interface ExposureRiskScore {
  score: number;
  level: ExposureRiskLevel;
  factors: string[];
}

export interface SecurityAction {
  id: string;
  text: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface BreachCheckReport {
  checkedAt: string;
  breachFound: boolean;
  breaches: BreachRecord[];
  categoriesFound: ExposureCategory[];
  categoriesNotFound: ExposureCategory[];
  riskScore: ExposureRiskScore;
  aiExplanation: AiExplanation;
  actionPlan: SecurityAction[];
  passwordsPotentiallyExposed: boolean;
}

export interface CheckBreachResult {
  report: BreachCheckReport;
  savedId?: string;
}

export const BREACH_CHECK_STAGES = [
  "Checking email...",
  "Searching known breach records...",
  "Analyzing exposure...",
  "Preparing security recommendations...",
];

export const EXPOSURE_CATEGORY_LABELS: Record<ExposureCategory, string> = {
  email: "Email Address",
  password: "Password",
  phone: "Phone Number",
  name: "Name",
  location: "Location",
  username: "Username",
  "ip-address": "IP Address",
  other: "Other Information",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

/** Calls the breach check endpoint. The email is sent only for this one request — see server/src/services/breachApiClient.ts for how the backend handles it. */
export async function checkBreach(email: string): Promise<CheckBreachResult> {
  const response = await fetch(`${API_BASE_URL}/api/breach/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ email }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? "Something went wrong checking that email. Please try again.");
  }

  return body as CheckBreachResult;
}
