import { describe, it, expect } from "vitest";
import {
  buildWebsiteAnalytics,
  buildPhishingAnalytics,
  buildPasswordAnalytics,
  buildPrivacyAnalytics,
  buildBreachAnalytics,
} from "../analyticsAggregation";
import type { ScanHistorySummary, EmailHistorySummary, PasswordHistorySummary, ResumeReportSummary, BreachHistorySummary } from "../../types";

describe("buildWebsiteAnalytics", () => {
  it("returns an honest empty state with zero scans", () => {
    const result = buildWebsiteAnalytics([]);
    expect(result.totalScanned).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.highestRiskScan).toBeNull();
  });

  it("correctly identifies the highest-risk scan as the LOWEST score, not the highest number", () => {
    const scans = [
      { url: "safe.com", score: 95, band: "safe" } as ScanHistorySummary,
      { url: "risky.com", score: 20, band: "danger" } as ScanHistorySummary,
    ];
    const result = buildWebsiteAnalytics(scans);
    expect(result.highestRiskScan?.url).toBe("risky.com");
    expect(result.lowestRiskScan?.url).toBe("safe.com");
  });

  it("computes risk distribution from real band values", () => {
    const scans = [
      { url: "a", score: 95, band: "safe" } as ScanHistorySummary,
      { url: "b", score: 60, band: "warning" } as ScanHistorySummary,
      { url: "c", score: 20, band: "danger" } as ScanHistorySummary,
    ];
    const result = buildWebsiteAnalytics(scans);
    expect(result.riskDistribution).toEqual({ safe: 1, caution: 1, risk: 1 });
  });
});

describe("buildPhishingAnalytics", () => {
  it("returns an honest empty state with zero reports", () => {
    const result = buildPhishingAnalytics([]);
    expect(result.totalAnalyzed).toBe(0);
    expect(result.averageScore).toBeNull();
  });

  it("counts suspicious and likely-phishing separately", () => {
    const reports = [
      { riskScore: 90, classification: "likely-safe" } as EmailHistorySummary,
      { riskScore: 40, classification: "suspicious" } as EmailHistorySummary,
      { riskScore: 10, classification: "likely-phishing" } as EmailHistorySummary,
    ];
    const result = buildPhishingAnalytics(reports);
    expect(result.suspiciousCount).toBe(1);
    expect(result.likelyPhishingCount).toBe(1);
  });
});

describe("buildPasswordAnalytics", () => {
  it("returns null checklist fields when no checklist data is available", () => {
    const result = buildPasswordAnalytics([], null);
    expect(result.mfaChecked).toBeNull();
    expect(result.passwordManagerChecked).toBeNull();
  });

  it("reflects the provided latest checklist state honestly", () => {
    const reports = [{ score: 80, analyzedAt: "2026-01-01", checklistCompletionPercent: 60 } as PasswordHistorySummary];
    const result = buildPasswordAnalytics(reports, { usesMfa: true, usesPasswordManager: false });
    expect(result.mfaChecked).toBe(true);
    expect(result.passwordManagerChecked).toBe(false);
  });

  it("never includes any password-like field on the returned object", () => {
    const result = buildPasswordAnalytics([{ score: 80, analyzedAt: "2026-01-01", checklistCompletionPercent: 60 } as PasswordHistorySummary], null);
    expect(JSON.stringify(result).toLowerCase()).not.toContain("password\":\"");
  });
});

describe("buildPrivacyAnalytics", () => {
  it("returns an honest empty state with zero scans", () => {
    const result = buildPrivacyAnalytics([]);
    expect(result.totalScans).toBe(0);
    expect(result.mostCommonFindingSummaries).toEqual([]);
  });

  it("summarizes rating distribution, most common first", () => {
    const reports = [
      { privacyScore: 90, privacyRating: "excellent", analyzedAt: "2026-01-01" } as ResumeReportSummary,
      { privacyScore: 60, privacyRating: "needs-improvement", analyzedAt: "2026-01-02" } as ResumeReportSummary,
      { privacyScore: 55, privacyRating: "needs-improvement", analyzedAt: "2026-01-03" } as ResumeReportSummary,
    ];
    const result = buildPrivacyAnalytics(reports);
    expect(result.mostCommonFindingSummaries[0]).toContain("needs-improvement");
  });
});

describe("buildBreachAnalytics", () => {
  it("returns an honest empty state with zero checks", () => {
    const result = buildBreachAnalytics([], null);
    expect(result.totalChecks).toBe(0);
    expect(result.mostRecentCheck).toBeNull();
  });

  it("counts only checks that actually found a breach as 'known exposures'", () => {
    const reports = [
      { checkedAt: "2026-01-01", riskLevel: "low", breachCount: 0, maskedEmail: "a***@x.com" } as BreachHistorySummary,
      { checkedAt: "2026-01-02", riskLevel: "high", breachCount: 3, maskedEmail: "b***@x.com" } as BreachHistorySummary,
    ];
    const result = buildBreachAnalytics(reports, null);
    expect(result.knownExposures).toBe(1);
  });

  it("never displays leaked credentials or passwords — only counts and metadata", () => {
    const reports = [{ checkedAt: "2026-01-01", riskLevel: "high", breachCount: 2, maskedEmail: "a***@x.com" } as BreachHistorySummary];
    const result = buildBreachAnalytics(reports, 3);
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("credential");
  });
});
