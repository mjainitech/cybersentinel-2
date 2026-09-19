import { authHeader } from "@/services/authToken";
import type { ExposureRiskLevel, BreachCheckReport, SecurityAction } from "@/services/breachService";

export interface BreachHistorySummary {
  id: string;
  checkedAt: string;
  maskedEmail: string;
  breachCount: number;
  riskLevel: ExposureRiskLevel;
}

export interface BreachHistoryRecord extends BreachHistorySummary {
  actionPlan: SecurityAction[];
  report: BreachCheckReport;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function listBreachReports(
  params: { search?: string; sortBy?: "date" | "risk"; sortDir?: "asc" | "desc" } = {}
): Promise<BreachHistorySummary[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  const response = await fetch(`${API_BASE_URL}/api/breach/reports?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  const { reports } = await handle<{ reports: BreachHistorySummary[] }>(response);
  return reports;
}

export async function getBreachReportRecord(id: string): Promise<BreachHistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/breach/reports/${id}`, {
    headers: { ...authHeader() },
  });
  const { report } = await handle<{ report: BreachHistoryRecord }>(response);
  return report;
}

export async function deleteBreachReportRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/breach/reports/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong deleting that report.");
  }
}

export async function toggleBreachActionItem(reportId: string, actionId: string): Promise<SecurityAction[]> {
  const response = await fetch(`${API_BASE_URL}/api/breach/reports/${reportId}/actions/${actionId}`, {
    method: "PATCH",
    headers: { ...authHeader() },
  });
  const { actionPlan } = await handle<{ actionPlan: SecurityAction[] }>(response);
  return actionPlan;
}
