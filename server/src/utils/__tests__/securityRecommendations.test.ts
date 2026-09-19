import { describe, it, expect } from "vitest";
import { generateSecurityRecommendations } from "../securityRecommendations";
import type { SecurityCategoryResult } from "../../types";

function makeCategory(overrides: Partial<SecurityCategoryResult> = {}): SecurityCategoryResult {
  return {
    id: "website-security",
    title: "Website Security",
    hasData: true,
    score: 90,
    status: "excellent",
    explanation: "test",
    recommendedAction: "test action",
    stats: {},
    ...overrides,
  };
}

describe("generateSecurityRecommendations", () => {
  it("does not recommend anything for a high-scoring category", () => {
    const recs = generateSecurityRecommendations([makeCategory({ score: 95 })]);
    expect(recs).toHaveLength(0);
  });

  it("prioritizes low-scoring categories as high priority", () => {
    const recs = generateSecurityRecommendations([makeCategory({ score: 30 })]);
    expect(recs[0].priority).toBe("high");
  });

  it("sorts high priority before medium and low", () => {
    const recs = generateSecurityRecommendations([
      makeCategory({ id: "privacy", score: 60 }), // medium
      makeCategory({ id: "password-security", score: 20 }), // high
      makeCategory({ id: "phishing-awareness", score: 85 }), // low
    ]);
    expect(recs.map((r) => r.priority)).toEqual(["high", "medium", "low"]);
  });

  it("gives a gentle low-priority nudge for categories with no data, not a warning", () => {
    const recs = generateSecurityRecommendations([makeCategory({ hasData: false, score: null, status: "no-data" })]);
    expect(recs[0].priority).toBe("low");
  });

  it("now generates a gentle get-started nudge for education too, since the Learning Hub gives it real data", () => {
    const recs = generateSecurityRecommendations([
      makeCategory({ id: "education", hasData: false, score: null, status: "no-data" }),
    ]);
    expect(recs).toHaveLength(1);
    expect(recs[0].priority).toBe("low");
  });

  it("caps the list at 5 recommendations", () => {
    const categories = [
      makeCategory({ id: "website-security", score: 10 }),
      makeCategory({ id: "password-security", score: 10 }),
      makeCategory({ id: "account-exposure", score: 10 }),
      makeCategory({ id: "privacy", score: 10 }),
      makeCategory({ id: "phishing-awareness", score: 10 }),
    ];
    const recs = generateSecurityRecommendations(categories);
    expect(recs.length).toBeLessThanOrEqual(5);
  });
});
