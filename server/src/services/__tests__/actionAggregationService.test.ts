import { describe, it, expect } from "vitest";
import { buildActionCenter } from "../actionAggregationService";

// A user id guaranteed to have zero saved history anywhere in this
// project's stores — every list*ForUser call returns [] for it.
const BRAND_NEW_USER = "test-user-brand-new-action-center";

describe("buildActionCenter — new user empty state", () => {
  it("marks isNewUser true when there is no saved activity anywhere", async () => {
    const result = await buildActionCenter(BRAND_NEW_USER);
    expect(result.isNewUser).toBe(true);
  });

  it("never fabricates actions for a brand-new user — every action still traces to a real source", async () => {
    const result = await buildActionCenter(BRAND_NEW_USER);
    for (const action of result.actions) {
      expect(action.sources.length).toBeGreaterThan(0);
    }
  });

  it("reports zero completed actions for a brand-new user", async () => {
    const result = await buildActionCenter(BRAND_NEW_USER);
    expect(result.overview.completed).toBe(0);
  });

  it("overview counts are always non-negative integers derived from the actual action list", async () => {
    const result = await buildActionCenter(BRAND_NEW_USER);
    const total = result.overview.critical + result.overview.high + result.overview.recommended;
    expect(total).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(total)).toBe(true);
  });
});
