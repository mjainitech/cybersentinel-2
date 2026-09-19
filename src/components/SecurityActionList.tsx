import { useState } from "react";
import { Check, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { SecurityAction } from "@/services/breachService";
import { toggleBreachActionItem } from "@/services/breachHistoryService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

interface SecurityActionListProps {
  actions: SecurityAction[];
  /** Present only if this report was saved — enables persisting checkbox state to the backend. Without it, toggling is local-only for the session. */
  reportId?: string;
}

const PRIORITY_ICON = { high: AlertOctagon, medium: AlertTriangle, low: Info };
const PRIORITY_COLOR = { high: "#EF5A5A", medium: "#F5A623", low: "#4F7CFF" };

/** Prioritized, checkable action plan. Shows "Security actions completed: X/Y" and persists completion when a reportId is available. */
export function SecurityActionList({ actions: initialActions, reportId }: SecurityActionListProps) {
  const [actions, setActions] = useState(initialActions);
  const { showToast } = useToast();

  const completedCount = actions.filter((a) => a.completed).length;

  const handleToggle = async (actionId: string) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a)));

    if (reportId) {
      try {
        const updated = await toggleBreachActionItem(reportId, actionId);
        setActions(updated);
      } catch (error) {
        // Revert on failure — the save didn't take, so the UI shouldn't imply it did.
        setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a)));
        showToast(error instanceof Error ? error.message : "Couldn't update that item.", "error");
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>Security actions completed</span>
        <span className="font-mono text-ink">
          {completedCount}/{actions.length}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-elevated">
        <div
          className="h-full rounded-full bg-cta-gradient transition-all duration-300 ease-out"
          style={{ width: `${actions.length === 0 ? 0 : (completedCount / actions.length) * 100}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {actions.map((action) => {
          const Icon = PRIORITY_ICON[action.priority];
          const color = PRIORITY_COLOR[action.priority];
          return (
            <li key={action.id}>
              <button
                onClick={() => handleToggle(action.id)}
                aria-pressed={action.completed}
                className="flex w-full items-center gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3 text-left transition-colors hover:bg-base-elevated/60"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    action.completed ? "border-accent-secondary bg-accent-secondary/20 text-accent-secondary" : "border-base-border"
                  )}
                >
                  {action.completed && <Check className="h-3.5 w-3.5" />}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <span className={cn("text-sm", action.completed ? "text-ink-muted line-through" : "text-ink")}>{action.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
