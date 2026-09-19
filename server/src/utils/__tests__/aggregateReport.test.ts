import { describe, it, expect } from "vitest";
import { aggregateReport } from "../aggregateReport";
import type { ScanCheckResult } from "../../types";

function makeCheck(id: string, status: ScanCheckResult["status"]): ScanCheckResult {
  return { id, title: id, value: "test", summary: "test", status };
}

describe("aggregateReport", () => {
  it("scores a fully safe scan at 100 with rating A and high confidence", () => {
    const checks = [makeCheck("https", "safe"), makeCheck("dns", "safe")];
    const report = aggregateReport("https://example.com", checks);

    expect(report.score).toBe(100);
    expect(report.rating).toBe("A");
    expect(report.band).toBe("safe");
    expect(report.confidence).toBe("high");
    expect(report.meta.partial).toBe(false);
  });

  it("deducts points for warnings and dangers, and never drops below 0", () => {
    const checks = [
      makeCheck("https", "danger"),
      makeCheck("ssl-certificate", "danger"),
      makeCheck("redirects", "danger"),
      makeCheck("dns", "danger"),
      makeCheck("registrar", "danger"),
      makeCheck("domain-age", "danger"),
    ];
    const report = aggregateReport("https://example.com", checks);

    // 6 dangers × 20 points would be -120, well past 0 — confirms the floor actually clamps.
    expect(report.score).toBe(0);
    expect(report.band).toBe("danger");
    expect(report.rating).toBe("F");
  });

  it("does not penalize unknown/unavailable checks", () => {
    const checks = [makeCheck("https", "safe"), makeCheck("dns", "unknown")];
    const report = aggregateReport("https://example.com", checks);

    expect(report.score).toBe(100);
    expect(report.meta.partial).toBe(true);
    expect(report.meta.unavailableChecks).toEqual(["dns"]);
  });

  it("lowers confidence as more checks come back unknown", () => {
    const oneUnknown = aggregateReport("https://example.com", [makeCheck("https", "safe"), makeCheck("dns", "unknown")]);
    const threeUnknown = aggregateReport("https://example.com", [
      makeCheck("https", "safe"),
      makeCheck("dns", "unknown"),
      makeCheck("registrar", "unknown"),
      makeCheck("redirects", "unknown"),
    ]);

    expect(oneUnknown.confidence).toBe("medium");
    expect(threeUnknown.confidence).toBe("low");
  });

  it("assigns every check a report category", () => {
    const checks = [makeCheck("https", "safe"), makeCheck("malware-reputation", "safe")];
    const report = aggregateReport("https://example.com", checks);

    expect(report.checks.every((check) => Boolean(check.category))).toBe(true);
    expect(report.checks.find((c) => c.id === "https")?.category).toBe("connection");
    expect(report.checks.find((c) => c.id === "malware-reputation")?.category).toBe("reputation");
  });

  it("always returns at least one recommendation", () => {
    const allSafe = aggregateReport("https://example.com", [makeCheck("https", "safe")]);
    expect(allSafe.recommendations.length).toBeGreaterThan(0);
  });
});
