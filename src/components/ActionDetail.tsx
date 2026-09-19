import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Sparkles, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/Button";
import { AIExplainButton } from "@/components/AIExplainButton";
import { SOURCE_LABELS } from "@/services/actionCenterService";
import type { SecurityAction, ActionStatus } from "@/services/actionCenterService";

interface ActionDetailProps {
  action: SecurityAction;
  onStatusChange: (actionKey: string, status: ActionStatus) => void;
}

export function ActionDetail({ action, onStatusChange }: ActionDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Why This Matters</h4>
        <p className="mt-1.5 text-sm text-ink-muted">{action.reason}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Sources</h4>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {action.sources.map((source) => (
            <span key={source} className="rounded-full bg-base-elevated px-2 py-0.5 text-[11px] text-ink-muted">
              {SOURCE_LABELS[source]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Calendar className="h-3 w-3" />
        Identified {new Date(action.createdAt).toLocaleDateString()}
      </div>

      {(action.recommendedToolHref || action.relatedLessonId) && (
        <div className="flex flex-col gap-2">
          {action.recommendedToolHref && (
            <Link to={action.recommendedToolHref}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className="w-full justify-between">
                {action.recommendedToolLabel ?? "Open Related Tool"}
              </Button>
            </Link>
          )}
          {action.relatedLessonId && (
            <Link to={`/dashboard/learning-hub/lessons/${action.relatedLessonId}`}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<GraduationCap className="h-3.5 w-3.5" />}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="w-full justify-between"
              >
                {action.relatedLessonTitle ? `Start Lesson: ${action.relatedLessonTitle}` : "Start Related Lesson"}
              </Button>
            </Link>
          )}
        </div>
      )}

      <AIExplainButton
        label="Ask AI About This Action"
        explain={{ kind: "security-profile" }}
        prompt={`Can you explain why the "${action.title}" action exists, what caused it, and how I can complete it?`}
      />

      <div className="flex flex-wrap gap-2 border-t border-base-border pt-3">
        {action.status !== "completed" && (
          <Button
            size="sm"
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            onClick={() => onStatusChange(action.actionKey, "completed")}
          >
            Mark Completed
          </Button>
        )}
        {action.status === "not-started" && (
          <Button variant="outline" size="sm" onClick={() => onStatusChange(action.actionKey, "in-progress")}>
            Mark In Progress
          </Button>
        )}
        {action.status !== "dismissed" && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
            onClick={() => onStatusChange(action.actionKey, "dismissed")}
          >
            Dismiss
          </Button>
        )}
        {action.status === "completed" && (
          <Button variant="ghost" size="sm" onClick={() => onStatusChange(action.actionKey, "not-started")}>
            Reopen
          </Button>
        )}
      </div>
      <p className="flex items-center gap-1 text-[11px] text-ink-faint">
        <Sparkles className="h-3 w-3" />
        Dismissing only hides this suggestion — it never deletes the underlying scan or security result it came from.
      </p>
    </div>
  );
}
