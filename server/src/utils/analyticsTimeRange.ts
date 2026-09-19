import type { AnalyticsTimeRange } from "../types";

export const TIME_RANGE_LABELS: Record<AnalyticsTimeRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "6m": "Last 6 Months",
  "1y": "Last Year",
  all: "All Time",
};

const RANGE_DAYS: Record<AnalyticsTimeRange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "6m": 182,
  "1y": 365,
  all: null,
};

/** Returns the start-of-range Date, or null for "all" (no lower bound). */
export function getRangeStartDate(range: AnalyticsTimeRange, now: Date = new Date()): Date | null {
  const days = RANGE_DAYS[range];
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/** Filters any array of items with a date-like field to only those within the selected range. */
export function filterByTimeRange<T>(
  items: T[],
  getDate: (item: T) => string,
  range: AnalyticsTimeRange,
  now: Date = new Date()
): T[] {
  const start = getRangeStartDate(range, now);
  if (!start) return items;

  return items.filter((item) => {
    const time = new Date(getDate(item)).getTime();
    return !Number.isNaN(time) && time >= start.getTime();
  });
}

/** Splits a set of items in half chronologically — used for "earlier vs. recent" improvement comparisons. */
export function splitIntoHalves<T>(items: T[], getDate: (item: T) => string): { earlier: T[]; recent: T[] } {
  const sorted = [...items].sort((a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime());
  const midpoint = Math.ceil(sorted.length / 2);
  return { earlier: sorted.slice(0, midpoint), recent: sorted.slice(midpoint) };
}
