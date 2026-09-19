import { AlertTriangle, XCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { Card } from "@/components/Card";
import type { Recommendation } from "@/services/scanService";
import { cn } from "@/utils/cn";

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const priorityConfig = {
  danger: { icon: XCircle, color: "#EF5A5A" },
  warning: { icon: AlertTriangle, color: "#F5A623" },
  safe: { icon: CheckCircle2, color: "#22D3B8" },
};

/**
 * A short, prioritized action list generated directly from this
 * scan's findings — distinct from the AI explanation's free-text
 * "next steps": every item here traces back to one specific check,
 * and this list is always available even without an AI key configured.
 */
export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <Card glass className="p-6 sm:p-7">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
          <Lightbulb className="h-4 w-4 text-accent-secondary" />
        </div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">
          Recommendations
        </h2>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {recommendations.map((rec) => {
          const { icon: Icon, color } = priorityConfig[rec.priority];
          return (
            <li key={rec.id} className="flex items-start gap-3 rounded-xl border border-base-border bg-base-elevated/40 p-3.5">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0")} style={{ color }} />
              <div>
                <p className="text-sm font-medium text-ink">{rec.text}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{rec.reason}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
