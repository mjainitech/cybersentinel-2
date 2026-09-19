import { Info, AlertTriangle, AlertOctagon, Flame } from "lucide-react";
import type { ThreatSeverity } from "@/services/threatService";

interface ThreatSeverityBadgeProps {
  severity: ThreatSeverity | "unknown";
  size?: "sm" | "md";
}

/** Every severity pairs a distinct icon with its color and label — never conveyed by color alone. */
const SEVERITY_CONFIG = {
  low: { icon: Info, color: "#4F7CFF", label: "Low" },
  medium: { icon: AlertTriangle, color: "#F5A623", label: "Medium" },
  high: { icon: AlertOctagon, color: "#EF5A5A", label: "High" },
  critical: { icon: Flame, color: "#EF5A5A", label: "Critical" },
  unknown: { icon: Info, color: "#5B6479", label: "Unrated" },
};

export function ThreatSeverityBadge({ severity, size = "md" }: ThreatSeverityBadgeProps) {
  const { icon: Icon, color, label } = SEVERITY_CONFIG[severity];

  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      }
      style={{ color, backgroundColor: `${color}1A` }}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
      <span aria-label={`Severity: ${label}`}>{label}</span>
    </span>
  );
}
