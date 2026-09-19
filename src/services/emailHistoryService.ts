import { authHeader } from "@/services/authToken";
import type { EmailRiskClassification, EmailAnalysisReport } from "@/services/emailAnalysisService";

export interface EmailHistorySummary {
  id: string;
  analyzedAt: string;
  riskScore: number;
  classification: EmailRiskClassification;
  summary: string;
}

export interface EmailHistoryRecord extends EmailHistorySummary {
  report: EmailAnalysisReport;
}

export interface ListEmailReportsParams {
  search?: string;
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function listEmailReports(params: ListEmailReportsParams = {}): Promise<EmailHistorySummary[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  const response = await fetch(`${API_BASE_URL}/api/email/reports?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  const { reports } = await handle<{ reports: EmailHistorySummary[] }>(response);
  return reports;
}

export async function getEmailReportRecord(id: string): Promise<EmailHistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/email/reports/${id}`, {
    headers: { ...authHeader() },
  });
  const { report } = await handle<{ report: EmailHistoryRecord }>(response);
  return report;
}

export async function deleteEmailReportRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/email/reports/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong deleting that report.");
  }
}

export async function exportSavedEmailReportPdf(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/email/reports/${id}/export`, {
    headers: { ...authHeader() },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong generating that PDF.");
  }

  return response.blob();
}
