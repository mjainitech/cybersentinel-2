import { authHeader } from "@/services/authToken";
import type { PasswordRating } from "@/utils/passwordAnalysis";

export interface PasswordChecklistState {
  uniquePasswords: boolean;
  usesMfa: boolean;
  usesPasswordManager: boolean;
  avoidsReuse: boolean;
  checksForBreaches: boolean;
}

export interface PasswordHistorySummary {
  id: string;
  analyzedAt: string;
  score: number;
  rating: PasswordRating;
  checklistCompletionPercent: number;
}

export interface PasswordHistoryRecord extends PasswordHistorySummary {
  recommendations: string[];
  checklist: PasswordChecklistState;
}

export interface SavePasswordReportInput {
  score: number;
  rating: PasswordRating;
  recommendations: string[];
  checklist: PasswordChecklistState;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

/** Saves only the analysis result — score, rating, recommendation text, checklist booleans. Never a password. */
export async function savePasswordReport(input: SavePasswordReportInput): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/password/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(input),
  });
  const { id } = await handle<{ id: string }>(response);
  return id;
}

export async function listPasswordReports(params: { sortBy?: "date" | "score"; sortDir?: "asc" | "desc" } = {}): Promise<
  PasswordHistorySummary[]
> {
  const query = new URLSearchParams();
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  const response = await fetch(`${API_BASE_URL}/api/password/reports?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  const { reports } = await handle<{ reports: PasswordHistorySummary[] }>(response);
  return reports;
}

export async function getPasswordReportRecord(id: string): Promise<PasswordHistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/password/reports/${id}`, {
    headers: { ...authHeader() },
  });
  const { report } = await handle<{ report: PasswordHistoryRecord }>(response);
  return report;
}

export async function deletePasswordReportRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/password/reports/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong deleting that report.");
  }
}

export async function exportPasswordReportPdf(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/password/reports/${id}/export`, {
    headers: { ...authHeader() },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong generating that PDF.");
  }

  return response.blob();
}
