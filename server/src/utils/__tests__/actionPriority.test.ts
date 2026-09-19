import { describe, it, expect } from "vitest";
import { calculateActionPriority } from "../actionPriority";

describe("calculateActionPriority", () => {
  it("classifies a category score below 40 as critical", () => {
    expect(calculateActionPriority({ kind: "category-score", score: 20 })).toBe("critical");
    expect(calculateActionPriority({ kind: "category-score", score: 39 })).toBe("critical");
  });

  it("classifies a category score 40-59 as high", () => {
    expect(calculateActionPriority({ kind: "category-score", score: 40 })).toBe("high");
    expect(calculateActionPriority({ kind: "category-score", score: 59 })).toBe("high");
  });

  it("classifies a category score 60-79 as medium", () => {
    expect(calculateActionPriority({ kind: "category-score", score: 60 })).toBe("medium");
    expect(calculateActionPriority({ kind: "category-score", score: 79 })).toBe("medium");
  });

  it("classifies a category score 80+ as low", () => {
    expect(calculateActionPriority({ kind: "category-score", score: 80 })).toBe("low");
    expect(calculateActionPriority({ kind: "category-score", score: 100 })).toBe("low");
  });

  it("always treats a missing security checklist item as at least high, regardless of any aggregate score", () => {
    expect(calculateActionPriority({ kind: "security-checklist-item" })).toBe("high");
  });

  it("maps threat severity one-to-one with the Threat Intelligence Dashboard's own scale", () => {
    expect(calculateActionPriority({ kind: "threat-severity", severity: "critical" })).toBe("critical");
    expect(calculateActionPriority({ kind: "threat-severity", severity: "high" })).toBe("high");
    expect(calculateActionPriority({ kind: "threat-severity", severity: "medium" })).toBe("medium");
    expect(calculateActionPriority({ kind: "threat-severity", severity: "low" })).toBe("low");
  });

  it("treats a learning gap as medium — useful but not urgent", () => {
    expect(calculateActionPriority({ kind: "learning-gap" })).toBe("medium");
  });

  it("treats a minor improvement suggestion as low", () => {
    expect(calculateActionPriority({ kind: "minor-improvement" })).toBe("low");
  });
});
