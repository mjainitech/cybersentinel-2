import { Button } from "@/components/Button";
import type { ActionPriority } from "@/services/actionCenterService";

interface ActionFiltersProps {
  priority: ActionPriority | null;
  onPriorityChange: (value: ActionPriority | null) => void;
  showCompleted: boolean;
  onShowCompletedChange: (value: boolean) => void;
}

const PRIORITIES: { value: ActionPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function ActionFilters({ priority, onPriorityChange, showCompleted, onShowCompletedChange }: ActionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by priority">
        <Button variant={priority === null ? "secondary" : "outline"} size="sm" onClick={() => onPriorityChange(null)}>
          All Priorities
        </Button>
        {PRIORITIES.map((p) => (
          <Button
            key={p.value}
            variant={priority === p.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => onPriorityChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <Button
        variant={showCompleted ? "secondary" : "outline"}
        size="sm"
        aria-pressed={showCompleted}
        onClick={() => onShowCompletedChange(!showCompleted)}
      >
        {showCompleted ? "Hide Completed" : "Show Completed"}
      </Button>
    </div>
  );
}
