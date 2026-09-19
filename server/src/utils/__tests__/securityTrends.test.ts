import { describe, it, expect } from "vitest";
import { buildSecurityTrends } from "../securityTrends";
import type { ScanHistorySummary, ResumeReportSummary } from "../../types";

const EMPTY_INPUTS = { scans: [], resumeReports: [], emailReports: [], passwordReports: [] };

describe("buildSecurityTrends", () => {
  it("returns no trends when there's no data at all (empty state)", () => {
    expect(buildSecurityTrends(EMPTY_INPUTS)).toEqual([]);
  });

  it("omits a category's trend when it has fewer than 3 data points", () => {
    const scans = [
      { scannedAt: "2024-01-01", score: 80 } as ScanHistorySummary,
      { scannedAt: "2024-02-01", score: 85 } as ScanHistorySummary,
    ];
    const trends = buildSecurityTrends({ ...EMPTY_INPUTS, scans });
    expect(trends.find((t) => t.category === "website-security")).toBeUndefined();
  });

  it("includes a category's trend once it has 3 or more data points, sorted chronologically", () => {
    const scans = [
      { scannedAt: "2024-03-01", score: 70 } as ScanHistorySummary,
      { scannedAt: "2024-01-01", score: 80 } as ScanHistorySummary,
      { scannedAt: "2024-02-01", score: 90 } as ScanHistorySummary,
    ];
    const trends = buildSecurityTrends({ ...EMPTY_INPUTS, scans });
    const websiteTrend = trends.find((t) => t.category === "website-security");
    expect(websiteTrend).toBeDefined();
    expect(websiteTrend?.points.map((p) => p.score)).toEqual([80, 90, 70]);
  });

  it("builds independent trends per category", () => {
    const scans = Array.from({ length: 3 }, (_, i) => ({ scannedAt: `2024-0${i + 1}-01`, score: 80 }) as ScanHistorySummary);
    const resumeReports = Array.from(
      { length: 3 },
      (_, i) => ({ analyzedAt: `2024-0${i + 1}-01`, privacyScore: 70 }) as ResumeReportSummary
    );
    const trends = buildSecurityTrends({ ...EMPTY_INPUTS, scans, resumeReports });
    expect(trends).toHaveLength(2);
    expect(trends.map((t) => t.category).sort()).toEqual(["privacy", "website-security"]);
  });

  it("never fabricates a synthetic overall-score trend", () => {
    const scans = Array.from({ length: 3 }, (_, i) => ({ scannedAt: `2024-0${i + 1}-01`, score: 80 }) as ScanHistorySummary);
    const trends = buildSecurityTrends({ ...EMPTY_INPUTS, scans });
    expect(trends.some((t) => (t.category as string) === "overall")).toBe(false);
  });
});
