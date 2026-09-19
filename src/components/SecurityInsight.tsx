import { Lightbulb } from "lucide-react";
import type { AnalyticsInsight } from "@/services/analyticsService";

interface SecurityInsightProps {
  insight: AnalyticsInsight;
}

export function SecurityInsight({ insight }: SecurityInsightProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3.5">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
      <p className="text-sm text-ink-muted">{insight.text}</p>
    </div>
  );
}
