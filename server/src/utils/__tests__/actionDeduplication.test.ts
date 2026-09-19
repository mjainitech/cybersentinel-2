import { describe, it, expect } from "vitest";
import { deduplicateActions } from "../actionDeduplication";
import type { SecurityAction } from "../../types";

function makeAction(overrides: Partial<SecurityAction>): SecurityAction {
  return {
    actionKey: "test-action",
    title: "Test",
    description: "test",
    reason: "test",
    priority: "low",
    sources: ["security-center"],
    estimatedEffortMinutes: 5,
    status: "not-started",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("deduplicateActions", () => {
  it("implements the spec's exact example: MFA flagged by both Password Security and Security Center merges into one action", () => {
    const candidates = [
      makeAction({ actionKey: "enable-mfa", title: "Enable Multi-Factor Authentication", sources: ["password-center"], priority: "high" }),
      makeAction({ actionKey: "enable-mfa", title: "Enable Multi-Factor Authentication", sources: ["security-center"], priority: "high" }),
    ];

    const result = deduplicateActions(candidates);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toEqual(expect.arrayContaining(["password-center", "security-center"]));
    expect(result[0].sources).toHaveLength(2);
  });

  it("keeps unrelated actions separate", () => {
    const candidates = [makeAction({ actionKey: "enable-mfa" }), makeAction({ actionKey: "check-account-exposure" })];
    expect(deduplicateActions(candidates)).toHaveLength(2);
  });

  it("keeps the HIGHER priority when merging, never averaging it down", () => {
    const candidates = [
      makeAction({ actionKey: "improve-privacy", priority: "low", sources: ["resume-scanner"] }),
      makeAction({ actionKey: "improve-privacy", priority: "critical", sources: ["security-center"] }),
    ];
    const result = deduplicateActions(candidates);
    expect(result[0].priority).toBe("critical");
  });

  it("does not duplicate identical source entries when merging", () => {
    const candidates = [
      makeAction({ actionKey: "enable-mfa", sources: ["password-center"] }),
      makeAction({ actionKey: "enable-mfa", sources: ["password-center"] }),
    ];
    const result = deduplicateActions(candidates);
    expect(result[0].sources).toEqual(["password-center"]);
  });

  it("returns an empty array for empty input", () => {
    expect(deduplicateActions([])).toEqual([]);
  });
});
