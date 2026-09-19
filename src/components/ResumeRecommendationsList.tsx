import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { ResumeRecommendation } from "@/services/resumeScanService";

interface ResumeRecommendationsListProps {
  recommendations: ResumeRecommendation[];
}

const priorityConfig = {
  high: { icon: AlertOctagon, color: "#EF5A5A" },
  medium: { icon: AlertTriangle, color: "#F5A623" },
  low: { icon: Info, color: "#4F7CFF" },
};

/**
 * Recommendations tied directly to what was detected on this resume —
 * separate from the AI review's free-text suggestions: this list is
 * deterministic and always available, even with no AI key configured.
 */
export function ResumeRecommendationsList({ recommendations }: ResumeRecommendationsListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {recommendations.map((rec) => {
        const { icon: Icon, color } = priorityConfig[rec.priority];
        return (
          <li key={rec.id} className="flex items-start gap-3 rounded-xl border border-base-border bg-base-elevated/40 p-3.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
            <div>
              <p className="text-sm font-medium text-ink">{rec.text}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{rec.reason}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
