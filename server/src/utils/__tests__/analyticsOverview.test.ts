import { describe, it, expect } from "vitest";
import { buildAnalyticsOverview } from "../analyticsOverview";
import type { SecurityScoreSnapshot } from "../../types";

function makeSnapshot(date: string, overallScore: number | null): SecurityScoreSnapshot {
  return { id: date, userId: "u1", date, overallScore, grade: null, categoryScores: {} };
}

describe("buildAnalyticsOverview", () => {
  it("reports hasEnoughData: false with zero security checks (new user empty state)", () => {
    const overview = buildAnalyticsOverview([], 0, 0, null, [], 0);
    expect(overview.hasEnoughData).toBe(false);
    expect(overview.overallScore).toBeNull();
    expect(overview.scoreChange).toBeNull();
  });

  it("computes scoreChange from the two most recent snapshots", () => {
    const snapshots = [makeSnapshot("2026-01-01", 60), makeSnapshot("2026-01-02", 75)];
    const overview = buildAnalyticsOverview(snapshots, 3, 3, null, [], 0);
    expect(overview.scoreChange).toBe(15);
  });

  it("reports scoreChange as null with only one snapshot, rather than fabricating a change", () => {
    const overview = buildAnalyticsOverview([makeSnapshot("2026-01-01", 60)], 1, 1, null, [], 0);
    expect(overview.scoreChange).toBeNull();
  });

  it("counts openRecommendations directly from the provided top-priorities list length", () => {
    const overview = buildAnalyticsOverview(
      [],
      2,
      2,
      null,
      [
        { id: "a", text: "x", reason: "y", priority: "high", category: "privacy" },
        { id: "b", text: "x", reason: "y", priority: "low", category: "privacy" },
      ],
      0
    );
    expect(overview.openRecommendations).toBe(2);
  });

  it("never fabricates a score change when one snapshot's score is null", () => {
    const snapshots = [makeSnapshot("2026-01-01", null), makeSnapshot("2026-01-02", 75)];
    const overview = buildAnalyticsOverview(snapshots, 2, 2, null, [], 0);
    expect(overview.scoreChange).toBeNull();
  });
});
