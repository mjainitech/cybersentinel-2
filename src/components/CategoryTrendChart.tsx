import { SecurityChart } from "@/components/SecurityChart";
import type { SecurityTrendSeries } from "@/services/analyticsService";

interface CategoryTrendChartProps {
  series: SecurityTrendSeries;
}

/**
 * The Security Center already has an accessible trend chart
 * (SecurityChart) for exactly this SecurityTrendSeries shape — this
 * is a thin named wrapper for the Analytics Center, not a duplicate
 * charting implementation.
 */
export function CategoryTrendChart({ series }: CategoryTrendChartProps) {
  return <SecurityChart series={series} />;
}
