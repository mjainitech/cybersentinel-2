import { describe, it, expect } from "vitest";
import {
  calculateWebsiteSecurityCategory,
  calculatePasswordSecurityCategory,
  calculateAccountExposureCategory,
  calculatePrivacyCategory,
  calculatePhishingAwarenessCategory,
  calculateEducationCategory,
} from "../securityCategories";
import type {
  ScanHistorySummary,
  PasswordHistorySummary,
  BreachHistorySummary,
  ResumeReportSummary,
  EmailHistorySummary,
} from "../../types";

describe("calculateWebsiteSecurityCategory", () => {
  it("returns hasData: false with no scans (empty state)", () => {
    const result = calculateWebsiteSecurityCategory([]);
    expect(result.hasData).toBe(false);
    expect(result.score).toBeNull();
    expect(result.status).toBe("no-data");
  });

  it("averages scores and counts risk bands from real scans", () => {
    const scans = [
      { score: 90, band: "safe" } as ScanHistorySummary,
      { score: 30, band: "danger" } as ScanHistorySummary,
    ];
    const result = calculateWebsiteSecurityCategory(scans);
    expect(result.hasData).toBe(true);
    expect(result.score).toBe(60);
    expect(result.stats.highRisk).toBe(1);
    expect(result.stats.lowRisk).toBe(1);
  });
});

describe("calculatePasswordSecurityCategory", () => {
  it("returns hasData: false with no reports", () => {
    expect(calculatePasswordSecurityCategory([]).hasData).toBe(false);
  });

  it("uses the most recent report's checklist completion, not an average", () => {
    const reports = [
      { score: 80, analyzedAt: "2024-01-01", checklistCompletionPercent: 40 } as PasswordHistorySummary,
      { score: 80, analyzedAt: "2024-06-01", checklistCompletionPercent: 100 } as PasswordHistorySummary,
    ];
    const result = calculatePasswordSecurityCategory(reports);
    expect(result.stats.checklistCompletion).toBe(100);
  });
});

describe("calculateAccountExposureCategory", () => {
  it("returns hasData: false and 'run your first check' with no reports", () => {
    const result = calculateAccountExposureCategory([]);
    expect(result.hasData).toBe(false);
    expect(result.recommendedAction).toMatch(/run your first breach check/i);
  });

  it("uses the most recent check's risk level, not an average across all past checks", () => {
    const reports = [
      { checkedAt: "2024-01-01", riskLevel: "severe", breachCount: 5, maskedEmail: "a***@x.com" } as BreachHistorySummary,
      { checkedAt: "2024-06-01", riskLevel: "low", breachCount: 0, maskedEmail: "a***@x.com" } as BreachHistorySummary,
    ];
    const result = calculateAccountExposureCategory(reports);
    expect(result.stats.mostRecentRiskLevel).toBe("low");
    expect(result.score).toBeGreaterThan(80);
  });

  it("never claims an account is safe when no breach was found", () => {
    const reports = [
      { checkedAt: "2024-01-01", riskLevel: "low", breachCount: 0, maskedEmail: "a***@x.com" } as BreachHistorySummary,
    ];
    const result = calculateAccountExposureCategory(reports);
    expect(result.explanation.toLowerCase()).not.toContain("safe account");
    expect(result.explanation).toMatch(/doesn't guarantee/i);
  });
});

describe("calculatePrivacyCategory", () => {
  it("returns hasData: false with no reports", () => {
    expect(calculatePrivacyCategory([]).hasData).toBe(false);
  });

  it("averages privacy scores", () => {
    const reports = [
      { privacyScore: 100, analyzedAt: "2024-01-01" } as ResumeReportSummary,
      { privacyScore: 50, analyzedAt: "2024-02-01" } as ResumeReportSummary,
    ];
    expect(calculatePrivacyCategory(reports).score).toBe(75);
  });
});

describe("calculatePhishingAwarenessCategory", () => {
  it("returns hasData: false with no reports", () => {
    expect(calculatePhishingAwarenessCategory([]).hasData).toBe(false);
  });

  it("counts suspicious/likely-phishing emails correctly", () => {
    const reports = [
      { riskScore: 90, classification: "likely-safe" } as EmailHistorySummary,
      { riskScore: 20, classification: "likely-phishing" } as EmailHistorySummary,
      { riskScore: 40, classification: "suspicious" } as EmailHistorySummary,
    ];
    const result = calculatePhishingAwarenessCategory(reports);
    expect(result.stats.suspiciousDetected).toBe(2);
  });
});

describe("calculateEducationCategory", () => {
  it("reports hasData: false when the user hasn't completed any lessons yet", () => {
    const result = calculateEducationCategory({
      lessonsCompleted: 0,
      quizzesCompleted: 0,
      averageQuizScore: null,
      totalAvailableLessons: 14,
    });
    expect(result.hasData).toBe(false);
    expect(result.score).toBeNull();
  });

  it("computes a real score once lessons are completed, from completion percent and quiz average", () => {
    const result = calculateEducationCategory({
      lessonsCompleted: 14,
      quizzesCompleted: 12,
      averageQuizScore: 90,
      totalAvailableLessons: 14,
    });
    expect(result.hasData).toBe(true);
    // 100% completion averaged with a 90% quiz score should land at 95.
    expect(result.score).toBe(95);
  });

  it("never claims learning progress proves technical security", () => {
    const result = calculateEducationCategory({
      lessonsCompleted: 14,
      quizzesCompleted: 12,
      averageQuizScore: 90,
      totalAvailableLessons: 14,
    });
    expect(result.explanation).toMatch(/doesn't by itself prove/i);
  });
});
