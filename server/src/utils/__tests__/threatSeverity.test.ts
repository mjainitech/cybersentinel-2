import { describe, it, expect } from "vitest";
import { severityFromCvssScore } from "../threatSeverity";

describe("severityFromCvssScore", () => {
  it("returns 'unknown' for a null score", () => {
    expect(severityFromCvssScore(null)).toBe("unknown");
  });

  it("classifies critical at 9.0 and above", () => {
    expect(severityFromCvssScore(9.0)).toBe("critical");
    expect(severityFromCvssScore(10.0)).toBe("critical");
  });

  it("classifies high from 7.0 up to (not including) 9.0", () => {
    expect(severityFromCvssScore(7.0)).toBe("high");
    expect(severityFromCvssScore(8.9)).toBe("high");
  });

  it("classifies medium from 4.0 up to (not including) 7.0", () => {
    expect(severityFromCvssScore(4.0)).toBe("medium");
    expect(severityFromCvssScore(6.9)).toBe("medium");
  });

  it("classifies low above 0 and below 4.0", () => {
    expect(severityFromCvssScore(0.1)).toBe("low");
    expect(severityFromCvssScore(3.9)).toBe("low");
  });

  it("treats an exact 0 score as unknown rather than a false 'low'", () => {
    expect(severityFromCvssScore(0)).toBe("unknown");
  });
});
