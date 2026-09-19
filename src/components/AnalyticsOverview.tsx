import { ShieldCheck, ListChecks, GraduationCap, Lightbulb, Radar, CalendarCheck } from "lucide-react";
import type { AnalyticsOverview as AnalyticsOverviewType } from "@/services/analyticsService";
import { MetricCard } from "@/components/MetricCard";

interface AnalyticsOverviewProps {
  overview: AnalyticsOverviewType;
}

export function AnalyticsOverview({ overview }: AnalyticsOverviewProps) {
  if (!overview.hasEnoughData) {
    return (
      <div className="rounded-xl border border-dashed border-base-border bg-base-elevated/20 p-6 text-center text-sm text-ink-muted">
        Not enough data yet. Complete your first security check to start building analytics.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Overall Security Score" value={overview.overallScore} icon={ShieldCheck} change={overview.scoreChange} />
      <MetricCard label="Total Security Checks" value={overview.totalSecurityChecks} icon={ListChecks} />
      <MetricCard label="Checks This Month" value={overview.securityChecksThisMonth} icon={CalendarCheck} />
      <MetricCard
        label="Learning Progress"
        value={overview.learningProgressPercent !== null ? `${overview.learningProgressPercent}%` : null}
        icon={GraduationCap}
      />
      <MetricCard label="Open Recommendations" value={overview.openRecommendations} icon={Lightbulb} />
      <MetricCard label="Threats Reviewed" value={overview.threatsReviewed} icon={Radar} />
    </div>
  );
}
