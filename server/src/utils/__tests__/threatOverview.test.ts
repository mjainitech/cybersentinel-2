import { describe, it, expect } from "vitest";
import { buildThreatOverview } from "../threatOverview";
import type { ThreatEntry } from "../../types";

function makeEntry(overrides: Partial<ThreatEntry> = {}): ThreatEntry {
  return {
    id: "test",
    title: "Test",
    category: "phishing",
    severity: "medium",
    publishedDate: "2026-01-01",
    lastUpdatedDate: "2026-01-01",
    shortDescription: "test",
    fullDescription: "test",
    warningSigns: [],
    protectionSteps: [],
    source: { name: "Test", url: "https://example.com" },
    ...overrides,
  };
}

describe("buildThreatOverview", () => {
  it("counts threatsTracked as exactly the number of curated entries provided", () => {
    const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b" }), makeEntry({ id: "c" })];
    const overview = buildThreatOverview(entries, 5, "2026-01-01T00:00:00Z");
    expect(overview.threatsTracked).toBe(3);
  });

  it("marks vulnerabilityDataUnavailable and reports null when the NVD count is null", () => {
    const overview = buildThreatOverview([], null, null);
    expect(overview.criticalVulnerabilities).toBeNull();
    expect(overview.vulnerabilityDataUnavailable).toBe(true);
  });

  it("does not mark vulnerabilityDataUnavailable when a real count (including zero) is provided", () => {
    const overview = buildThreatOverview([], 0, "2026-01-01T00:00:00Z");
    expect(overview.criticalVulnerabilities).toBe(0);
    expect(overview.vulnerabilityDataUnavailable).toBe(false);
  });

  it("counts recentAdvisories only from high/critical severity entries", () => {
    const entries = [
      makeEntry({ id: "a", severity: "low" }),
      makeEntry({ id: "b", severity: "high" }),
      makeEntry({ id: "c", severity: "critical" }),
    ];
    const overview = buildThreatOverview(entries, null, null);
    expect(overview.recentAdvisories).toBe(2);
  });

  it("counts recentPhishingTrends from phishing and social-engineering categories only", () => {
    const entries = [
      makeEntry({ id: "a", category: "phishing" }),
      makeEntry({ id: "b", category: "social-engineering" }),
      makeEntry({ id: "c", category: "malware" }),
    ];
    const overview = buildThreatOverview(entries, null, null);
    expect(overview.recentPhishingTrends).toBe(2);
  });

  it("never fabricates a lastUpdated timestamp when none was provided", () => {
    const overview = buildThreatOverview([], null, null);
    expect(overview.lastUpdated).toBeNull();
  });
});
