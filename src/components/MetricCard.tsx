import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | string | null;
  icon?: LucideIcon;
  change?: number | null;
}

/** value: null renders as "Not enough data yet" rather than a misleading 0 or dash-only. */
export function MetricCard({ label, value, icon: Icon, change }: MetricCardProps) {
  const ChangeIcon = change === null || change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const changeColor = !change ? "#8891A5" : change > 0 ? "#22D3B8" : "#EF5A5A";

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-faint">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />}
      </div>
      {value === null ? (
        <p className="mt-1 text-sm text-ink-faint">Not enough data yet</p>
      ) : (
        <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      )}
      {ChangeIcon && change !== null && change !== undefined && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: changeColor }}>
          <ChangeIcon className="h-3 w-3" aria-hidden="true" />
          {change > 0 ? "+" : ""}
          {change} vs. previous
        </p>
      )}
    </div>
  );
}
