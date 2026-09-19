import { Flame, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { ActionPriority } from "@/services/actionCenterService";

interface PriorityBadgeProps {
  priority: ActionPriority;
  size?: "sm" | "md";
}

const PRIORITY_CONFIG: Record<ActionPriority, { icon: typeof Flame; color: string; label: string }> = {
  critical: { icon: Flame, color: "#EF5A5A", label: "Critical" },
  high: { icon: AlertOctagon, color: "#F5A623", label: "High Priority" },
  medium: { icon: AlertTriangle, color: "#4F7CFF", label: "Medium Priority" },
  low: { icon: Info, color: "#22D3B8", label: "Recommended" },
};

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const { icon: Icon, color, label } = PRIORITY_CONFIG[priority];

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
      <span aria-label={`Priority: ${label}`}>{label}</span>
    </span>
  );
}
