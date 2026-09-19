import { describe, it, expect } from "vitest";
import { filterThreatEntries, sortThreatEntries } from "../threatListUtils";
import type { ThreatEntry } from "../../types";

function makeEntry(overrides: Partial<ThreatEntry> = {}): ThreatEntry {
  return {
    id: "test-entry",
    title: "Test Entry",
    category: "phishing",
    severity: "medium",
    publishedDate: "2026-01-01",
    lastUpdatedDate: "2026-01-01",
    shortDescription: "A test threat entry.",
    fullDescription: "Full description.",
    warningSigns: [],
    protectionSteps: [],
    source: { name: "Test Source", url: "https://example.com" },
    ...overrides,
  };
}

describe("filterThreatEntries", () => {
  const entries = [
    makeEntry({ id: "a", title: "Ransomware Wave", category: "ransomware", severity: "critical" }),
    makeEntry({ id: "b", title: "Phishing Email Trend", category: "phishing", severity: "medium" }),
    makeEntry({ id: "c", title: "Password Reuse Risk", category: "identity-theft", severity: "low" }),
  ];

  it("returns all entries with no filters", () => {
    expect(filterThreatEntries(entries, {})).toHaveLength(3);
  });

  it("filters by category", () => {
    const result = filterThreatEntries(entries, { category: "phishing" });
    expect(result.map((e) => e.id)).toEqual(["b"]);
  });

  it("filters by severity", () => {
    const result = filterThreatEntries(entries, { severity: "critical" });
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });

  it("filters by search term matching the title", () => {
    const result = filterThreatEntries(entries, { search: "password" });
    expect(result.map((e) => e.id)).toEqual(["c"]);
  });

  it("search is case-insensitive", () => {
    const result = filterThreatEntries(entries, { search: "RANSOMWARE" });
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });

  it("combines multiple filters", () => {
    const result = filterThreatEntries(entries, { category: "phishing", severity: "critical" });
    expect(result).toHaveLength(0);
  });
});

describe("sortThreatEntries", () => {
  const entries = [
    makeEntry({ id: "old", severity: "low", publishedDate: "2025-01-01", lastUpdatedDate: "2025-06-01" }),
    makeEntry({ id: "new", severity: "high", publishedDate: "2026-06-01", lastUpdatedDate: "2025-01-01" }),
    makeEntry({ id: "critical", severity: "critical", publishedDate: "2025-03-01", lastUpdatedDate: "2026-07-01" }),
  ];

  it("sorts by newest published date first", () => {
    const result = sortThreatEntries(entries, "newest");
    expect(result[0].id).toBe("new");
  });

  it("sorts by most severe first", () => {
    const result = sortThreatEntries(entries, "most-severe");
    expect(result[0].id).toBe("critical");
    expect(result[1].id).toBe("new");
    expect(result[2].id).toBe("old");
  });

  it("sorts by most recently updated first", () => {
    const result = sortThreatEntries(entries, "recently-updated");
    expect(result[0].id).toBe("critical");
  });

  it("does not mutate the original array", () => {
    const original = [...entries];
    sortThreatEntries(entries, "most-severe");
    expect(entries).toEqual(original);
  });
});
