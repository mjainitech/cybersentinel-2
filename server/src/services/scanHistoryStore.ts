import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { CheckStatus, ScanHistoryRecord, ScanHistorySummary, ScanHistoryStats, ScanReportResponse } from "../types";

const store = new JsonFileStore<ScanHistoryRecord[]>(path.join(__dirname, "..", "..", "data", "scans.json"), []);

function summarize(record: ScanHistoryRecord): ScanHistorySummary {
  const { report, ...summary } = record;
  return summary;
}

function buildApiResultsSummary(report: ScanReportResponse): string {
  const counts: Record<CheckStatus, number> = { safe: 0, warning: 0, danger: 0, unknown: 0 };
  for (const check of report.checks) counts[check.status]++;

  const parts: string[] = [];
  if (counts.safe) parts.push(`${counts.safe} safe`);
  if (counts.warning) parts.push(`${counts.warning} caution`);
  if (counts.danger) parts.push(`${counts.danger} danger`);
  if (counts.unknown) parts.push(`${counts.unknown} unavailable`);

  return parts.join(" · ") || "No checks completed";
}

/** Saves a completed scan to a user's history. Called after every authenticated scan. */
export async function saveScanForUser(userId: string, report: ScanReportResponse): Promise<ScanHistoryRecord> {
  const httpsCheck = report.checks.find((check) => check.id === "https");

  const record: ScanHistoryRecord = {
    id: crypto.randomUUID(),
    userId,
    url: report.url,
    scannedAt: report.meta.scannedAt,
    score: report.score,
    band: report.band,
    httpsStatus: httpsCheck?.status ?? "unknown",
    recommendation: report.recommendation,
    apiResultsSummary: buildApiResultsSummary(report),
    favorite: false,
    report,
  };

  const scans = await store.read();
  scans.push(record);
  await store.write(scans);

  return record;
}

export interface ListScansOptions {
  search?: string;
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
  /** Filter to a single risk band, e.g. only "danger" scans. */
  band?: Exclude<CheckStatus, "unknown">;
  /** Filter to favorited scans only. */
  favoriteOnly?: boolean;
}

export async function listScansForUser(
  userId: string,
  options: ListScansOptions = {}
): Promise<ScanHistorySummary[]> {
  const { search, sortBy = "date", sortDir = "desc", band, favoriteOnly } = options;

  const scans = await store.read();
  let userScans = scans.filter((scan) => scan.userId === userId);

  if (search) {
    const term = search.toLowerCase();
    userScans = userScans.filter((scan) => scan.url.toLowerCase().includes(term));
  }

  if (band) {
    userScans = userScans.filter((scan) => scan.band === band);
  }

  if (favoriteOnly) {
    userScans = userScans.filter((scan) => scan.favorite);
  }

  userScans.sort((a, b) => {
    const diff = sortBy === "score" ? a.score - b.score : new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return userScans.map(summarize);
}

export async function getScanForUser(userId: string, scanId: string): Promise<ScanHistoryRecord | undefined> {
  const scans = await store.read();
  return scans.find((scan) => scan.id === scanId && scan.userId === userId);
}

export async function deleteScanForUser(userId: string, scanId: string): Promise<boolean> {
  const scans = await store.read();
  const index = scans.findIndex((scan) => scan.id === scanId && scan.userId === userId);
  if (index === -1) return false;

  scans.splice(index, 1);
  await store.write(scans);
  return true;
}

/** Toggles a scan's favorite flag and returns the new value, or undefined if not found/not owned. */
export async function toggleFavoriteForUser(userId: string, scanId: string): Promise<boolean | undefined> {
  const scans = await store.read();
  const record = scans.find((scan) => scan.id === scanId && scan.userId === userId);
  if (!record) return undefined;

  record.favorite = !record.favorite;
  await store.write(scans);
  return record.favorite;
}

const RECENT_ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getStatsForUser(userId: string): Promise<ScanHistoryStats> {
  const scans = await store.read();
  const userScans = scans.filter((scan) => scan.userId === userId);

  if (userScans.length === 0) {
    return { total: 0, averageScore: 0, mostCommonBand: null, recentActivity: 0 };
  }

  const bandCounts: Record<Exclude<CheckStatus, "unknown">, number> = { safe: 0, warning: 0, danger: 0 };
  let scoreSum = 0;
  let recentActivity = 0;
  const now = Date.now();

  for (const scan of userScans) {
    scoreSum += scan.score;
    bandCounts[scan.band]++;
    if (now - new Date(scan.scannedAt).getTime() <= RECENT_ACTIVITY_WINDOW_MS) recentActivity++;
  }

  const mostCommonBand = (Object.entries(bandCounts) as [Exclude<CheckStatus, "unknown">, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  return {
    total: userScans.length,
    averageScore: Math.round(scoreSum / userScans.length),
    mostCommonBand,
    recentActivity,
  };
}
