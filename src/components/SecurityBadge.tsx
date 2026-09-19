import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { CheckStatus } from "@/services/scanService";
import { cn } from "@/utils/cn";

interface SecurityBadgeProps {
  band: Exclude<CheckStatus, "unknown">;
  className?: string;
}

const config = {
  safe: { label: "Verified Safe", icon: ShieldCheck, color: "#22D3B8" },
  warning: { label: "Use Caution", icon: ShieldAlert, color: "#F5A623" },
  danger: { label: "At Risk", icon: ShieldX, color: "#EF5A5A" },
};

/**
 * A seal-style stamp for the overall verdict — deliberately distinct
 * from RiskScoreGauge (the numeric score) so the report has one
 * "at a glance" visual mark, the way a physical certification stamp would.
 */
export function SecurityBadge({ band, className }: SecurityBadgeProps) {
  const { label, icon: Icon, color } = config[band];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 animate-fade-up",
        className
      )}
      style={{ borderColor: `${color}40`, backgroundColor: `${color}14`, boxShadow: `0 0 24px -8px ${color}66` }}
    >
      <Icon className="h-4 w-4" style={{ color }} strokeWidth={2} />
      <span className="text-xs font-semibold tracking-wide" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
