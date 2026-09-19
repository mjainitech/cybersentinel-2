import { authHeader } from "@/services/authToken";
import type { PrivacyRating, ResumePrivacyReport } from "@/services/resumeScanService";

export interface ResumeReportSummary {
  id: string;
  fileName: string;
  analyzedAt: string;
  privacyScore: number;
  privacyRating: PrivacyRating;
  summary: string;
}

export interface ResumeReportRecord extends ResumeReportSummary {
  report: ResumePrivacyReport;
}

export interface ListResumeReportsParams {
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

export async function listResumeReports(params: ListResumeReportsParams = {}): Promise<ResumeReportSummary[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  const response = await fetch(`${API_BASE_URL}/api/resume/reports?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  const { reports } = await handle<{ reports: ResumeReportSummary[] }>(response);
  return reports;
}

export async function getResumeReportRecord(id: string): Promise<ResumeReportRecord> {
  const response = await fetch(`${API_BASE_URL}/api/resume/reports/${id}`, {
    headers: { ...authHeader() },
  });
  const { report } = await handle<{ report: ResumeReportRecord }>(response);
  return report;
}

export async function deleteResumeReportRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/resume/reports/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong deleting that report.");
  }
}

export async function exportSavedResumeReportPdf(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/resume/reports/${id}/export`, {
    headers: { ...authHeader() },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong generating that PDF.");
  }

  return response.blob();
}
