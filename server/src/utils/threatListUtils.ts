import type { ThreatEntry, ThreatCategory, ThreatSeverity } from "../types";
import { SEVERITY_ORDER } from "./threatSeverity";

export interface ThreatFilterOptions {
  search?: string;
  category?: ThreatCategory;
  severity?: ThreatSeverity;
}

export type ThreatSortBy = "newest" | "most-severe" | "recently-updated";

function matchesSearch(entry: ThreatEntry, query: string): boolean {
  const term = query.toLowerCase();
  return (
    entry.title.toLowerCase().includes(term) ||
    entry.shortDescription.toLowerCase().includes(term) ||
    entry.category.toLowerCase().includes(term)
  );
}

export function filterThreatEntries(entries: ThreatEntry[], options: ThreatFilterOptions): ThreatEntry[] {
  return entries.filter((entry) => {
    if (options.search && !matchesSearch(entry, options.search)) return false;
    if (options.category && entry.category !== options.category) return false;
    if (options.severity && entry.severity !== options.severity) return false;
    return true;
  });
}

export function sortThreatEntries(entries: ThreatEntry[], sortBy: ThreatSortBy): ThreatEntry[] {
  const sorted = [...entries];

  switch (sortBy) {
    case "most-severe":
      return sorted.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
    case "recently-updated":
      return sorted.sort((a, b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime());
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }
}
