import { authHeader } from "@/services/authToken";
import type { CheckStatus, RawScanReport } from "@/services/scanService";

export interface ScanHistorySummary {
  id: string;
  url: string;
  scannedAt: string;
  score: number;
  band: Exclude<CheckStatus, "unknown">;
  httpsStatus: CheckStatus;
  recommendation: string;
  apiResultsSummary: string;
  favorite: boolean;
}

export interface ScanHistoryRecord extends ScanHistorySummary {
  report: RawScanReport;
}

export interface ScanHistoryStats {
  total: number;
  averageScore: number;
  mostCommonBand: Exclude<CheckStatus, "unknown"> | null;
  recentActivity: number;
}

export interface ListScansParams {
  search?: string;
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
  band?: Exclude<CheckStatus, "unknown">;
  favoriteOnly?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function listScanHistory(params: ListScansParams = {}): Promise<ScanHistorySummary[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.band) query.set("band", params.band);
  if (params.favoriteOnly) query.set("favoriteOnly", "true");

  const response = await fetch(`${API_BASE_URL}/api/scans?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  const { scans } = await handle<{ scans: ScanHistorySummary[] }>(response);
  return scans;
}

export async function getScanHistoryStats(): Promise<ScanHistoryStats> {
  const response = await fetch(`${API_BASE_URL}/api/scans/stats`, {
    headers: { ...authHeader() },
  });
  const { stats } = await handle<{ stats: ScanHistoryStats }>(response);
  return stats;
}

export async function toggleScanFavorite(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/scans/${id}/favorite`, {
    method: "PATCH",
    headers: { ...authHeader() },
  });
  const { favorite } = await handle<{ favorite: boolean }>(response);
  return favorite;
}

export async function getScanHistoryRecord(id: string): Promise<ScanHistoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/scans/${id}`, {
    headers: { ...authHeader() },
  });
  const { scan } = await handle<{ scan: ScanHistoryRecord }>(response);
  return scan;
}

export async function deleteScanHistoryRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scans/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong deleting that scan.");
  }
}
