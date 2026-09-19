import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ActionDetail } from "@/components/ActionDetail";
import type { SecurityAction } from "@/services/actionCenterService";
import { cn } from "@/utils/cn";

interface ActionCardProps {
  action: SecurityAction;
  onStatusChange: (actionKey: string, status: SecurityAction["status"]) => void;
}

export function ActionCard({ action, onStatusChange }: ActionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCompleted = action.status === "completed";

  return (
    <div className={cn("surface-card overflow-hidden transition-opacity", isCompleted && "opacity-60")}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={action.priority} size="sm" />
            {isCompleted && <span className="text-[11px] font-medium text-accent-secondary">Completed</span>}
            {action.status === "in-progress" && <span className="text-[11px] font-medium text-accent-primary">In Progress</span>}
          </div>
          <h3 className="mt-1.5 font-display text-sm font-semibold text-ink">{action.title}</h3>
          <p className="mt-1 text-xs text-ink-muted">{action.description}</p>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-faint">
            <Clock className="h-3 w-3" />
            About {action.estimatedEffortMinutes} min
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-faint transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="border-t border-base-border p-4">
          <ActionDetail action={action} onStatusChange={onStatusChange} />
        </div>
      )}
    </div>
  );
}
