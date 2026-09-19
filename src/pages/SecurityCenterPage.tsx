import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  RotateCcw,
  Lightbulb,
  History,
  TrendingUp,
  Award,
  Sparkles,
  LayoutGrid,
  Globe2,
  Mail,
  FileSearch,
  KeySquare,
  ShieldAlert,
  GraduationCap,
  Bot,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ExpandableSection } from "@/components/ExpandableSection";
import { SecurityScore } from "@/components/SecurityScore";
import { SecurityCategoryCard } from "@/components/SecurityCategoryCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { SecurityTimeline } from "@/components/SecurityTimeline";
import { SecurityChart } from "@/components/SecurityChart";
import { AchievementCard } from "@/components/AchievementCard";
import { AISecuritySummary } from "@/components/AISecuritySummary";
import { useToast } from "@/hooks/useToast";
import { getSecurityProfile } from "@/services/securityCenterService";
import type { SecurityProfileReport } from "@/services/securityCenterService";

type Status = "loading" | "done" | "error";

const GETTING_STARTED_ACTIONS = [
  { label: "Run Website Scan", href: "/dashboard/url-scanner", icon: Globe2 },
  { label: "Analyze an Email", href: "/dashboard/email-scanner", icon: Mail },
  { label: "Check Resume Privacy", href: "/dashboard/resume-scanner", icon: FileSearch },
  { label: "Review Password Security", href: "/dashboard/password-center", icon: KeySquare },
  { label: "Check for Data Breaches", href: "/dashboard/breach-checker", icon: ShieldAlert },
];

export function SecurityCenterPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<SecurityProfileReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { showToast } = useToast();

  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      setStatus("loading");
      try {
        const result = await getSecurityProfile(forceRefresh);
        setProfile(result.profile);
        setStatus("done");
        if (result.partial && result.partialMessage) {
          showToast(result.partialMessage, "info");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Some security information is temporarily unavailable.";
        setErrorMessage(message);
        setStatus("error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <ShieldCheck className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">CyberSentinel Security Profile</h1>
            <p className="text-sm text-ink-muted">
              An educational summary based only on your activity inside CyberSentinel — not a certified security audit.
            </p>
          </div>
        </div>

        {status === "loading" && <SecurityCenterSkeleton />}

        {status === "error" && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center">
            <p className="text-sm text-ink">{errorMessage}</p>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => fetchProfile(true)}>
              Try again
            </Button>
          </div>
        )}

        {status === "done" &&
          profile &&
          (profile.isNewUser ? (
            <NewUserEmptyState />
          ) : (
            <div className="mt-8 flex flex-col gap-6">
              <Card glass className="p-6 sm:p-8">
                <SecurityScore
                  score={profile.overallScore}
                  grade={profile.grade}
                  categoriesWithData={profile.categoriesWithData}
                  methodology={profile.scoringMethodology}
                />
              </Card>

              <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => fetchProfile(true)}>
                  Refresh
                </Button>
              </div>

              <ExpandableSection title="Security Categories" icon={LayoutGrid}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.categories.map((category) => (
                    <SecurityCategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </ExpandableSection>

              {profile.recommendations.length > 0 && (
                <div>
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">
                    Your Top Security Priorities
                  </h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {profile.recommendations.map((rec, index) => (
                      <RecommendationCard key={rec.id} recommendation={rec} rank={index + 1} />
                    ))}
                  </div>
                </div>
              )}

              <ExpandableSection title="AI Security Summary" icon={Sparkles}>
                <AISecuritySummary summary={profile.aiSummary} />
              </ExpandableSection>

              <Card className="flex flex-col items-center justify-between gap-4 p-5 text-center sm:flex-row sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-secondary/10 text-accent-secondary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Need help understanding your security profile?</p>
                    <p className="text-xs text-ink-muted">Ask the AI Security Coach — it can see your real scores and explain what they mean.</p>
                  </div>
                </div>
                <Link
                  to="/ai-security-coach"
                  state={{ explain: { kind: "security-profile" }, prompt: "Can you explain my current security profile?" }}
                >
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Ask AI Security Coach
                  </Button>
                </Link>
              </Card>

              <ExpandableSection title="Security Timeline" icon={History} defaultOpen={false}>
                <SecurityTimeline entries={profile.timeline} />
              </ExpandableSection>

              <ExpandableSection title="Trends" icon={TrendingUp} defaultOpen={false}>
                {profile.trends.length === 0 ? (
                  <p className="text-sm text-ink-muted">Complete more security checks to see trends.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {profile.trends.map((series) => (
                      <SecurityChart key={series.category} series={series} />
                    ))}
                  </div>
                )}
              </ExpandableSection>

              <ExpandableSection title="Achievements" icon={Award} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {profile.achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </ExpandableSection>

              <ExpandableSection title="Learning Progress" icon={GraduationCap} defaultOpen={false}>
                <p className="text-sm text-ink-muted">
                  Structured lessons, quizzes, and learning milestones are coming with the Learning Hub — this section will
                  track your progress once it's available.
                </p>
              </ExpandableSection>
            </div>
          ))}
      </div>
    </DashboardLayout>
  );
}

function NewUserEmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center gap-6 rounded-xl border border-dashed border-base-border bg-base-elevated/20 p-10 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
        <Lightbulb className="h-6 w-6 text-accent-secondary" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Your Security Profile is just getting started.</h2>
        <p className="mt-2 max-w-md text-sm text-ink-muted">
          Complete a few security checks below and your personalized score, categories, and recommendations will appear here.
        </p>
      </div>
      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {GETTING_STARTED_ACTIONS.map((action) => (
          <Link key={action.href} to={action.href}>
            <Button variant="outline" size="md" className="w-full" leftIcon={<action.icon className="h-4 w-4" />}>
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SecurityCenterSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-6" aria-hidden="true">
      <div className="surface-card flex flex-col items-center gap-4 p-8">
        <div className="h-36 w-36 animate-pulse rounded-full bg-base-elevated" />
        <div className="h-4 w-48 animate-pulse rounded-full bg-base-elevated" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-base-elevated" />
            <div className="h-8 w-1/3 animate-pulse rounded-full bg-base-elevated" />
            <div className="h-3 w-full animate-pulse rounded-full bg-base-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
