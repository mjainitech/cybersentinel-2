import { describe, it, expect } from "vitest";
import { calculateOverallScore, getGrade } from "../securityScore";
import type { SecurityCategoryResult } from "../../types";

function makeCategory(overrides: Partial<SecurityCategoryResult> = {}): SecurityCategoryResult {
  return {
    id: "website-security",
    title: "Website Security",
    hasData: true,
    score: 80,
    status: "good",
    explanation: "test",
    recommendedAction: "test",
    stats: {},
    ...overrides,
  };
}

describe("getGrade", () => {
  it("maps scores to the correct letter grades", () => {
    expect(getGrade(98)).toBe("A+");
    expect(getGrade(92)).toBe("A");
    expect(getGrade(85)).toBe("B");
    expect(getGrade(72)).toBe("C");
    expect(getGrade(55)).toBe("D");
    expect(getGrade(20)).toBe("F");
  });
});

describe("calculateOverallScore", () => {
  it("returns null score and grade when no category has data (empty state)", () => {
    const categories = [makeCategory({ hasData: false, score: null, status: "no-data" })];
    const result = calculateOverallScore(categories);
    expect(result.overallScore).toBeNull();
    expect(result.grade).toBeNull();
    expect(result.categoriesWithData).toBe(0);
  });

  it("excludes no-data categories from the average rather than treating them as 0", () => {
    const categories = [
      makeCategory({ score: 100 }),
      makeCategory({ id: "privacy", hasData: false, score: null, status: "no-data" }),
    ];
    const result = calculateOverallScore(categories);
    // If the no-data category were treated as 0, this would be 50, not 100.
    expect(result.overallScore).toBe(100);
    expect(result.categoriesWithData).toBe(1);
  });

  it("averages multiple scored categories equally", () => {
    const categories = [makeCategory({ score: 80 }), makeCategory({ id: "privacy", score: 60 })];
    const result = calculateOverallScore(categories);
    expect(result.overallScore).toBe(70);
  });

  it("always includes a scoringMethodology explanation, even with no data", () => {
    const result = calculateOverallScore([makeCategory({ hasData: false, score: null })]);
    expect(result.scoringMethodology.length).toBeGreaterThan(0);
  });
});
