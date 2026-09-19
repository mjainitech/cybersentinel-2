import { describe, it, expect } from "vitest";
import { compareValue } from "../analyticsComparison";

describe("compareValue", () => {
  it("reports 'not-enough-data' when either value is null", () => {
    expect(compareValue("Test", null, 80).direction).toBe("not-enough-data");
    expect(compareValue("Test", 80, null).direction).toBe("not-enough-data");
    expect(compareValue("Test", null, null).direction).toBe("not-enough-data");
  });

  it("treats a small change as 'no-change' rather than exaggerating it", () => {
    expect(compareValue("Test", 80, 82).direction).toBe("no-change");
    expect(compareValue("Test", 80, 78).direction).toBe("no-change");
  });

  it("reports 'improved' for a meaningful increase", () => {
    expect(compareValue("Test", 70, 85).direction).toBe("improved");
  });

  it("reports 'declined' for a meaningful decrease", () => {
    expect(compareValue("Test", 85, 70).direction).toBe("declined");
  });

  it("preserves the actual previous/current values regardless of direction", () => {
    const result = compareValue("Test", 70, 85);
    expect(result.previousValue).toBe(70);
    expect(result.currentValue).toBe(85);
  });
});
