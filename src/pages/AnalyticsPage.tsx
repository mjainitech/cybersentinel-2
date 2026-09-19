import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  RotateCcw,
  Globe2,
  Mail,
  KeySquare,
  FileSearch,
  ShieldAlert,
  Sparkles,
  ArrowUpDown,
  HelpCircle,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ExpandableSection } from "@/components/ExpandableSection";
import { AnalyticsFilter } from "@/components/AnalyticsFilter";
import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { SecurityTrendChart } from "@/components/SecurityTrendChart";
import { CategoryTrendChart } from "@/components/CategoryTrendChart";
import { ComparisonCard } from "@/components/ComparisonCard";
import { SecurityInsight } from "@/components/SecurityInsight";
import { RecommendationPriority } from "@/components/RecommendationPriority";
import { ReportGenerator } from "@/components/ReportGenerator";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { useToast } from "@/hooks/useToast";
import { getAnalyticsDashboard, compareAnalyticsPeriods } from "@/services/analyticsService";
import type { AnalyticsTimeRange, AnalyticsDashboardResponse, AnalyticsComparisonResponse } from "@/services/analyticsService";

type Status = "loading" | "done" | "error";

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsTimeRange>("30d");
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const [comparison, setComparison] = useState<AnalyticsComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await getAnalyticsDashboard(range);
      setData(result);
      setStatus("done");
      if (result.partial && result.partialMessage) {
        showToast(result.partialMessage, "info");
      }
    } catch {
      setStatus("error");
    }
  }, [range, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompare = async () => {
    setIsComparing(true);
    try {
      setComparison(await compareAnalyticsPeriods("30d", "30d"));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Comparison failed.", "error");
    } finally {
      setIsComparing(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading your security analytics..." className="mt-16 py-16" />
      </DashboardLayout>
    );
  }

  if (status === "error" || !data) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <p className="text-sm text-ink">Some analytics are temporarily unavailable.</p>
          <Button variant="outline" size="sm" className="mt-4" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={fetchData}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <BarChart3 className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Security Analytics</h1>
            <p className="text-sm text-ink-muted">Understand your security activity, identify trends, and see where you can improve.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <AnalyticsFilter value={range} onChange={setRange} />
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={fetchData}>
            Refresh
          </Button>
        </div>

        <div className="mt-6">
          <AnalyticsOverview overview={data.overview} />
        </div>

        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Security Score Trend</h2>
          <Card className="mt-3 p-5">
            <SecurityTrendChart snapshots={data.overallScoreTrend} />
          </Card>
        </div>

        {data.categoryTrends.length > 0 && (
          <div className="mt-8">
            <ExpandableSection title="Category Trends" icon={BarChart3}>
              <div className="grid gap-6 sm:grid-cols-2">
                {data.categoryTrends.map((series) => (
                  <CategoryTrendChart key={series.category} series={series} />
                ))}
              </div>
            </ExpandableSection>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ExpandableSection title="Website Security" icon={Globe2} defaultOpen={false}>
            {data.website.totalScanned === 0 ? (
              <p className="text-sm text-ink-muted">Complete your first website scan to see analytics here.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p>Total scanned: {data.website.totalScanned}</p>
                <p>Average score: {data.website.averageScore}/100</p>
                {data.website.highestRiskScan && (
                  <p>
                    Highest risk: {data.website.highestRiskScan.url} ({data.website.highestRiskScan.score})
                  </p>
                )}
                {data.website.lowestRiskScan && (
                  <p>
                    Lowest risk: {data.website.lowestRiskScan.url} ({data.website.lowestRiskScan.score})
                  </p>
                )}
                <p>
                  Risk distribution: {data.website.riskDistribution.safe} safe · {data.website.riskDistribution.caution} caution ·{" "}
                  {data.website.riskDistribution.risk} risk
                </p>
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection title="Phishing Analytics" icon={Mail} defaultOpen={false}>
            {data.phishing.totalAnalyzed === 0 ? (
              <p className="text-sm text-ink-muted">Analyze your first email to see analytics here.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p>Emails analyzed: {data.phishing.totalAnalyzed}</p>
                <p>Average score: {data.phishing.averageScore}/100</p>
                <p>
                  Suspicious: {data.phishing.suspiciousCount} · Likely phishing: {data.phishing.likelyPhishingCount}
                </p>
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection title="Password Analytics" icon={KeySquare} defaultOpen={false}>
            {data.password.assessmentsCompleted === 0 ? (
              <p className="text-sm text-ink-muted">Complete a password assessment to see analytics here.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p>Assessments completed: {data.password.assessmentsCompleted}</p>
                <p>Average score: {data.password.averageScore}/100</p>
                <p>Checklist completion: {data.password.checklistCompletionPercent ?? "—"}%</p>
                <p>MFA checklist: {data.password.mfaChecked === null ? "Unknown" : data.password.mfaChecked ? "Complete" : "Not complete"}</p>
                <p>
                  Password manager checklist:{" "}
                  {data.password.passwordManagerChecked === null
                    ? "Unknown"
                    : data.password.passwordManagerChecked
                    ? "Complete"
                    : "Not complete"}
                </p>
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection title="Privacy Analytics" icon={FileSearch} defaultOpen={false}>
            {data.privacy.totalScans === 0 ? (
              <p className="text-sm text-ink-muted">Scan a resume to see analytics here.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p>Privacy scans: {data.privacy.totalScans}</p>
                <p>Average score: {data.privacy.averageScore}/100</p>
                {data.privacy.mostCommonFindingSummaries.map((s, i) => (
                  <p key={i}>{s}</p>
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection title="Breach Analytics" icon={ShieldAlert} defaultOpen={false}>
            {data.breach.totalChecks === 0 ? (
              <p className="text-sm text-ink-muted">Run a breach check to see analytics here.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p>Checks run: {data.breach.totalChecks}</p>
                <p>Known exposures: {data.breach.knownExposures}</p>
                {data.breach.mostRecentCheck && (
                  <p>
                    Most recent: {data.breach.mostRecentCheck.maskedEmail} ({data.breach.mostRecentCheck.riskLevel})
                  </p>
                )}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection title="Learning & Threat Intel" icon={Sparkles} defaultOpen={false}>
            <div className="flex flex-col gap-2 text-sm text-ink-muted">
              <p>Lessons completed: {data.learning.lessonsCompleted}</p>
              <p>
                Level {data.learning.currentLevel} — {data.learning.levelTitle} ({data.learning.xpEarned} XP)
              </p>
              <p>Learning streak: {data.learning.currentStreak} days</p>
              <p className="mt-2">
                Threats viewed: {data.threatIntel.threatsViewed} · Bookmarked: {data.threatIntel.threatsBookmarked}
              </p>
            </div>
          </ExpandableSection>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">How Your Security Has Changed</h2>
          <div className="mt-3 flex flex-col gap-2">
            {data.improvements.length === 0 ? (
              <p className="text-sm text-ink-muted">Complete more security checks to see your progress.</p>
            ) : (
              data.improvements.map((item, i) => (
                <p
                  key={i}
                  className="text-sm"
                  style={{ color: item.direction === "improved" ? "#22D3B8" : item.direction === "declined" ? "#EF5A5A" : "#8891A5" }}
                >
                  {item.text}
                </p>
              ))
            )}
          </div>
        </div>

        {data.insights.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Security Insights</h2>
            <div className="mt-3 flex flex-col gap-2">
              {data.insights.map((insight, i) => (
                <SecurityInsight key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {data.topPriorities.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Top Priorities</h2>
            <div className="mt-3 flex flex-col gap-3">
              {data.topPriorities.map((rec, i) => (
                <RecommendationPriority key={rec.id} recommendation={rec} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <ExpandableSection title="AI Security Summary" icon={Sparkles}>
            <AiExplanationCard explanation={data.aiSummary} />
          </ExpandableSection>
        </div>

        <div className="mt-6">
          <ExpandableSection title="Comparison Mode" icon={ArrowUpDown} defaultOpen={false}>
            <p className="text-sm text-ink-muted">Compare the previous 30 days against the current 30 days.</p>
            <Button className="mt-3" size="sm" onClick={handleCompare} isLoading={isComparing}>
              Compare Periods
            </Button>
            {comparison && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs text-ink-faint">
                  {comparison.previousLabel} vs. {comparison.currentLabel}
                </p>
                {comparison.results.map((result, i) => (
                  <ComparisonCard key={i} result={result} />
                ))}
              </div>
            )}
          </ExpandableSection>
        </div>

        <div className="mt-6">
          <ExpandableSection title="Generate Security Report" icon={FileText} defaultOpen={false}>
            <ReportGenerator defaultRange={range} />
          </ExpandableSection>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowMethodology((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent-primary hover:text-accent-secondary"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            How are these analytics calculated?
          </button>
          {showMethodology && (
            <div className="mt-3 rounded-lg border border-base-border bg-base-elevated/40 p-4 text-xs leading-relaxed text-ink-muted">
              <p>
                Every number here comes from your own saved CyberSentinel activity — website scans, resume checks, email
                analyses, password assessments, breach checks, Learning Hub progress, and Threat Intelligence activity.
                Category scores reuse the exact same methodology as the CyberSentinel Security Center — nothing here is a
                second, conflicting scoring system.
              </p>
              <p className="mt-2">
                The Security Score trend is built from periodic snapshots taken automatically when you visit the Security
                Center — it only reflects activity from when snapshots began being recorded, not retroactively
                reconstructed history.
              </p>
              <p className="mt-2">
                This is an educational analytics system based on your CyberSentinel activity. It does not constitute a
                professional cybersecurity assessment, and viewing or bookmarking threat intelligence content is never
                treated as evidence that you were personally targeted or attacked.
              </p>
            </div>
          )}
        </div>

        {!data.overview.hasEnoughData && (
          <div className="mt-8">
            <EmptyState
              icon={BarChart3}
              title="Your analytics are just getting started."
              description="Complete a security check, start a Learning Hub lesson, or review a threat to begin building your analytics."
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
