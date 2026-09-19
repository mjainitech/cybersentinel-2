import { describe, it, expect } from "vitest";
import { buildSecurityImprovements } from "../securityImprovement";
import type { SecurityTrendSeries } from "../../types";

function makeSeries(category: SecurityTrendSeries["category"], scores: number[]): SecurityTrendSeries {
  return {
    category,
    label: category,
    points: scores.map((score, i) => ({ date: `2026-01-0${i + 1}`, score })),
  };
}

describe("buildSecurityImprovements", () => {
  it("produces no comparison for a trend with too few points", () => {
    const trend = makeSeries("website-security", [80, 85, 90]); // only 3 points
    const result = buildSecurityImprovements([trend], 0, 0, null);
    expect(result.some((r) => r.text.includes("website security score"))).toBe(false);
  });

  it("reports 'improved' for a real, meaningful increase", () => {
    const trend = makeSeries("website-security", [50, 55, 90, 95]);
    const result = buildSecurityImprovements([trend], 0, 0, null);
    const item = result.find((r) => r.text.includes("website security score"));
    expect(item?.direction).toBe("improved");
  });

  it("reports 'declined' for a real, meaningful decrease", () => {
    const trend = makeSeries("privacy", [95, 90, 55, 50]);
    const result = buildSecurityImprovements([trend], 0, 0, null);
    const item = result.find((r) => r.text.includes("privacy score"));
    expect(item?.direction).toBe("declined");
  });

  it("treats a small fluctuation as 'no-change', never exaggerating it", () => {
    const trend = makeSeries("password-security", [80, 81, 82, 81]);
    const result = buildSecurityImprovements([trend], 0, 0, null);
    const item = result.find((r) => r.text.includes("password security score"));
    expect(item?.direction).toBe("no-change");
  });

  it("compares check counts between periods only when previous-period data exists", () => {
    const noPrevious = buildSecurityImprovements([], 5, 0, null);
    expect(noPrevious.some((r) => r.text.includes("security checks"))).toBe(false);

    const withPrevious = buildSecurityImprovements([], 10, 5, null);
    expect(withPrevious.some((r) => r.text.includes("more security checks"))).toBe(true);
  });

  it("never claims learning progress increased when there are zero completed lessons", () => {
    const result = buildSecurityImprovements([], 0, 0, {
      totalXp: 0,
      level: 1,
      levelTitle: "Cybersecurity Beginner",
      xpForNextLevel: null,
      xpIntoCurrentLevel: 0,
      xpNeededForNextLevel: null,
      lessonsCompleted: 0,
      totalAvailableLessons: 14,
      completionPercent: 0,
      quizzesCompleted: 0,
      achievementsEarned: 0,
      streak: { currentStreak: 0, longestStreak: 0, lastActivityDate: null, activityDates: [] },
      categoryProgress: [],
    });
    expect(result.some((r) => r.text.includes("learning progress"))).toBe(false);
  });
});
