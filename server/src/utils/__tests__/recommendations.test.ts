import { describe, it, expect } from "vitest";
import { generateRecommendations } from "../recommendations";
import type { ScanCheckResult } from "../../types";

function makeCheck(id: string, status: ScanCheckResult["status"]): ScanCheckResult {
  return { id, title: id, value: "test", summary: "test", status };
}

describe("generateRecommendations", () => {
  it("returns a single all-clear recommendation when everything is safe", () => {
    const recs = generateRecommendations([makeCheck("https", "safe"), makeCheck("dns", "safe")]);

    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe("all-clear");
    expect(recs[0].priority).toBe("safe");
  });

  it("recommends avoiding sensitive info when HTTPS fails", () => {
    const recs = generateRecommendations([makeCheck("https", "danger")]);
    expect(recs.some((rec) => rec.id === "avoid-sensitive-info")).toBe(true);
  });

  it("does not recommend anything for a check with no matching rule", () => {
    const recs = generateRecommendations([makeCheck("dns", "safe"), makeCheck("ip-address", "safe")]);
    // No rules exist for "dns" or "ip-address", so this should fall through to all-clear.
    expect(recs).toEqual([expect.objectContaining({ id: "all-clear" })]);
  });

  it("sorts danger-priority recommendations before warning-priority ones", () => {
    const recs = generateRecommendations([
      makeCheck("domain-age", "warning"),
      makeCheck("malware-reputation", "danger"),
    ]);

    expect(recs[0].priority).toBe("danger");
  });

  it("caps the list at 6 recommendations even if more rules fire", () => {
    const checks: ScanCheckResult[] = [
      makeCheck("https", "danger"),
      makeCheck("ssl-certificate", "danger"),
      makeCheck("domain-age", "warning"),
      makeCheck("registrar", "unknown"),
      makeCheck("malware-reputation", "danger"),
      makeCheck("community-verdict", "danger"),
      makeCheck("redirects", "warning"),
      makeCheck("security-headers", "warning"),
    ];
    const recs = generateRecommendations(checks);
    expect(recs.length).toBeLessThanOrEqual(6);
  });
});
