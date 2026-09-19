import type { AnalyticsComparisonCategoryResult } from "../types";

/** Below this point difference, a change is treated as noise, not a real improvement or decline. */
const NOISE_THRESHOLD = 3;

export function compareValue(
  category: string,
  previousValue: number | null,
  currentValue: number | null
): AnalyticsComparisonCategoryResult {
  if (previousValue === null || currentValue === null) {
    return { category, previousValue, currentValue, direction: "not-enough-data" };
  }

  const delta = currentValue - previousValue;
  if (Math.abs(delta) < NOISE_THRESHOLD) {
    return { category, previousValue, currentValue, direction: "no-change" };
  }

  return { category, previousValue, currentValue, direction: delta > 0 ? "improved" : "declined" };
}
