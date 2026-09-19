import { authHeader } from "@/services/authToken";
import type { AiExplanation } from "@/services/scanService";

export type ThreatCategory =
  | "phishing"
  | "malware"
  | "ransomware"
  | "data-breaches"
  | "vulnerabilities"
  | "identity-theft"
  | "social-engineering"
  | "web-security";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export interface ThreatSource {
  name: string;
  url: string;
}

export interface ThreatEntry {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  publishedDate: string;
  lastUpdatedDate: string;
  shortDescription: string;
  fullDescription: string;
  warningSigns: string[];
  protectionSteps: string[];
  source: ThreatSource;
  relatedLessonId?: string;
  relatedToolHref?: { label: string; href: string };
}

export interface CveRecord {
  id: string;
  severity: ThreatSeverity | "unknown";
  cvssScore: number | null;
  description: string;
  affectedProducts: string[];
  publishedDate: string;
  lastModifiedDate: string;
  referenceUrl: string;
}

export type ThreatListItem = ({ kind: "curated" } & ThreatEntry) | ({ kind: "cve" } & CveRecord);

export interface ThreatOverviewMetrics {
  threatsTracked: number;
  recentAdvisories: number;
  criticalVulnerabilities: number | null;
  recentPhishingTrends: number;
  lastUpdated: string | null;
  vulnerabilityDataUnavailable: boolean;
}

export interface ThreatRecommendation {
  label: string;
  href: string;
}

export interface ThreatDetailResponse {
  item: ThreatListItem;
  aiExplanation: AiExplanation | null;
  recommendations: ThreatRecommendation[];
  isBookmarked: boolean;
}

export interface ThreatBookmarkRecord {
  id: string;
  threatId: string;
  threatKind: "curated" | "cve";
  title: string;
  category: ThreatCategory | "vulnerabilities";
  bookmarkedAt: string;
}

export interface ThreatHistoryRecord {
  id: string;
  threatId: string;
  threatKind: "curated" | "cve";
  title: string;
  viewedAt: string;
}

export const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  phishing: "Phishing",
  malware: "Malware",
  ransomware: "Ransomware",
  "data-breaches": "Data Breaches",
  vulnerabilities: "Vulnerabilities",
  "identity-theft": "Identity Theft",
  "social-engineering": "Social Engineering",
  "web-security": "Web Security",
};

export type ThreatSortBy = "newest" | "most-severe" | "recently-updated";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function getOverview(): Promise<ThreatOverviewMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/threats/overview`);
  const { overview } = await handle<{ overview: ThreatOverviewMetrics }>(response);
  return overview;
}

export interface ListThreatsParams {
  search?: string;
  category?: ThreatCategory;
  severity?: ThreatSeverity;
  sortBy?: ThreatSortBy;
}

export async function listThreats(params: ListThreatsParams = {}): Promise<ThreatEntry[]> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.severity) query.set("severity", params.severity);
  if (params.sortBy) query.set("sortBy", params.sortBy);

  const response = await fetch(`${API_BASE_URL}/api/threats?${query.toString()}`);
  const { threats } = await handle<{ threats: ThreatEntry[] }>(response);
  return threats;
}

export async function listRecentCves(): Promise<CveRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/threats/cves`);
  const { cves } = await handle<{ cves: CveRecord[] }>(response);
  return cves;
}

export async function searchCves(query: string): Promise<CveRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/threats/cves/search?q=${encodeURIComponent(query)}`);
  const { cves } = await handle<{ cves: CveRecord[] }>(response);
  return cves;
}

export async function getThreatDetail(id: string): Promise<ThreatDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/threats/${encodeURIComponent(id)}`, {
    headers: { ...authHeader() },
  });
  return handle(response);
}

export async function bookmarkThreat(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/threats/${encodeURIComponent(id)}/bookmark`, {
    method: "POST",
    headers: { ...authHeader() },
  });
  await handle(response);
}

export async function unbookmarkThreat(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/threats/${encodeURIComponent(id)}/bookmark`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong removing that bookmark.");
  }
}

export async function listBookmarks(): Promise<ThreatBookmarkRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/threats/bookmarks`, { headers: { ...authHeader() } });
  const { bookmarks } = await handle<{ bookmarks: ThreatBookmarkRecord[] }>(response);
  return bookmarks;
}

export async function listHistory(): Promise<ThreatHistoryRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/threats/history`, { headers: { ...authHeader() } });
  const { history } = await handle<{ history: ThreatHistoryRecord[] }>(response);
  return history;
}

export async function clearHistory(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/threats/history`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong clearing your history.");
  }
}
