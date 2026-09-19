import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import type { AnalyticsComparisonCategoryResult } from "@/services/analyticsService";

interface ComparisonCardProps {
  result: AnalyticsComparisonCategoryResult;
}

const DIRECTION_CONFIG = {
  improved: { icon: TrendingUp, color: "#22D3B8", label: "Improved" },
  declined: { icon: TrendingDown, color: "#EF5A5A", label: "Declined" },
  "no-change": { icon: Minus, color: "#8891A5", label: "No Significant Change" },
  "not-enough-data": { icon: HelpCircle, color: "#5B6479", label: "Not Enough Data" },
};

export function ComparisonCard({ result }: ComparisonCardProps) {
  const { icon: Icon, color, label } = DIRECTION_CONFIG[result.direction];

  return (
    <div className="surface-card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-sm font-medium text-ink">{result.category}</p>
        {result.previousValue !== null && result.currentValue !== null ? (
          <p className="text-xs text-ink-faint">
            {result.previousValue} → {result.currentValue}
          </p>
        ) : (
          <p className="text-xs text-ink-faint">Not enough data in one or both periods</p>
        )}
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ color, backgroundColor: `${color}1A` }}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}
