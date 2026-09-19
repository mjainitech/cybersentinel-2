import type { AnalyticsTimeRange } from "@/services/analyticsService";
import { TIME_RANGE_LABELS } from "@/services/analyticsService";
import { Button } from "@/components/Button";

interface AnalyticsFilterProps {
  value: AnalyticsTimeRange;
  onChange: (value: AnalyticsTimeRange) => void;
}

const RANGES: AnalyticsTimeRange[] = ["7d", "30d", "90d", "6m", "1y", "all"];

export function AnalyticsFilter({ value, onChange }: AnalyticsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Select time range">
      {RANGES.map((range) => (
        <Button key={range} variant={value === range ? "secondary" : "outline"} size="sm" onClick={() => onChange(range)}>
          {TIME_RANGE_LABELS[range]}
        </Button>
      ))}
    </div>
  );
}
