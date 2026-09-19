import { describe, it, expect } from "vitest";
import { calculateExposureRiskScore } from "../exposureRiskScore";
import type { BreachRecord } from "../../types";

function makeBreach(overrides: Partial<BreachRecord> = {}): BreachRecord {
  return {
    name: "TestBreach",
    title: "Test Breach",
    domain: "test.com",
    breachDate: "2020-01-01",
    addedDate: "2020-02-01",
    exposedCategories: ["email"],
    isPasswordExposed: false,
    isSensitive: false,
    ...overrides,
  };
}

describe("calculateExposureRiskScore", () => {
  it("returns a zero, low-risk score with no breaches", () => {
    const result = calculateExposureRiskScore([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe("low");
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("increases score with more breaches", () => {
    const one = calculateExposureRiskScore([makeBreach()]);
    const three = calculateExposureRiskScore([makeBreach(), makeBreach(), makeBreach()]);
    expect(three.score).toBeGreaterThan(one.score);
  });

  it("adds extra weight when a password was exposed", () => {
    const withoutPassword = calculateExposureRiskScore([makeBreach({ isPasswordExposed: false })]);
    const withPassword = calculateExposureRiskScore([makeBreach({ isPasswordExposed: true })]);
    expect(withPassword.score).toBeGreaterThan(withoutPassword.score);
    expect(withPassword.factors.some((f) => f.toLowerCase().includes("password"))).toBe(true);
  });

  it("adds extra weight for sensitive breaches", () => {
    const normal = calculateExposureRiskScore([makeBreach({ isSensitive: false })]);
    const sensitive = calculateExposureRiskScore([makeBreach({ isSensitive: true })]);
    expect(sensitive.score).toBeGreaterThan(normal.score);
  });

  it("never exceeds 100", () => {
    const manyBreaches = Array.from({ length: 20 }, () => makeBreach({ isPasswordExposed: true, isSensitive: true }));
    const result = calculateExposureRiskScore(manyBreaches);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("classifies into the correct risk level bands", () => {
    expect(calculateExposureRiskScore([]).level).toBe("low");
    const severe = calculateExposureRiskScore(
      Array.from({ length: 6 }, () => makeBreach({ isPasswordExposed: true, isSensitive: true }))
    );
    expect(severe.level).toBe("severe");
  });
});
