import { describe, it, expect } from "vitest";
import { filterByTimeRange, getRangeStartDate, splitIntoHalves } from "../analyticsTimeRange";

const NOW = new Date("2026-06-15T00:00:00Z");

interface DatedItem {
  date: string;
}

describe("getRangeStartDate", () => {
  it("returns null for 'all' (no lower bound)", () => {
    expect(getRangeStartDate("all", NOW)).toBeNull();
  });

  it("computes 7 days back correctly", () => {
    const start = getRangeStartDate("7d", NOW)!;
    expect(start.toISOString().slice(0, 10)).toBe("2026-06-08");
  });

  it("computes 30 days back correctly", () => {
    const start = getRangeStartDate("30d", NOW)!;
    expect(start.toISOString().slice(0, 10)).toBe("2026-05-16");
  });
});

describe("filterByTimeRange", () => {
  const items: DatedItem[] = [
    { date: "2026-06-14T00:00:00Z" }, // 1 day ago
    { date: "2026-06-01T00:00:00Z" }, // 14 days ago
    { date: "2025-01-01T00:00:00Z" }, // over a year ago
  ];

  it("returns everything for 'all'", () => {
    expect(filterByTimeRange(items, (i) => i.date, "all", NOW)).toHaveLength(3);
  });

  it("excludes items older than the selected range", () => {
    const result = filterByTimeRange(items, (i) => i.date, "7d", NOW);
    expect(result).toHaveLength(1);
  });

  it("includes items within a wider range", () => {
    const result = filterByTimeRange(items, (i) => i.date, "30d", NOW);
    expect(result).toHaveLength(2);
  });

  it("excludes items with an unparseable date rather than crashing", () => {
    const withBadDate: DatedItem[] = [...items, { date: "not-a-date" }];
    const result = filterByTimeRange(withBadDate, (i) => i.date, "7d", NOW);
    expect(result).toHaveLength(1);
  });
});

describe("splitIntoHalves", () => {
  it("splits an even-length array evenly", () => {
    const items: DatedItem[] = [{ date: "2026-01-01" }, { date: "2026-01-02" }, { date: "2026-01-03" }, { date: "2026-01-04" }];
    const { earlier, recent } = splitIntoHalves(items, (i) => i.date);
    expect(earlier).toHaveLength(2);
    expect(recent).toHaveLength(2);
  });

  it("sorts chronologically before splitting, regardless of input order", () => {
    const items: DatedItem[] = [{ date: "2026-01-04" }, { date: "2026-01-01" }, { date: "2026-01-03" }, { date: "2026-01-02" }];
    const { earlier } = splitIntoHalves(items, (i) => i.date);
    expect(earlier.map((i) => i.date)).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("puts the extra item in the earlier half for odd-length arrays", () => {
    const items: DatedItem[] = [{ date: "2026-01-01" }, { date: "2026-01-02" }, { date: "2026-01-03" }];
    const { earlier, recent } = splitIntoHalves(items, (i) => i.date);
    expect(earlier).toHaveLength(2);
    expect(recent).toHaveLength(1);
  });
});
