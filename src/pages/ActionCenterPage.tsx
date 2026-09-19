import { useCallback, useEffect, useState } from "react";
import { ListChecks, RotateCcw, CheckCircle2, Flame, AlertOctagon, Lightbulb, PartyPopper } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ActionCard } from "@/components/ActionCard";
import { ActionFilters } from "@/components/ActionFilters";
import { QuickActions } from "@/components/QuickActions";
import { useToast } from "@/hooks/useToast";
import { getActionCenter, updateActionStatus } from "@/services/actionCenterService";
import type { ActionCenterResponse, ActionPriority, ActionStatus } from "@/services/actionCenterService";

type Status = "loading" | "done" | "error";

export function ActionCenterPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<ActionCenterResponse | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ActionPriority | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setStatus("loading");
    try {
      setData(await getActionCenter());
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (actionKey: string, newStatus: ActionStatus) => {
    if (!data) return;
    setData({ ...data, actions: data.actions.map((a) => (a.actionKey === actionKey ? { ...a, status: newStatus } : a)) });
    try {
      await updateActionStatus(actionKey, newStatus);
      showToast(newStatus === "completed" ? "Marked completed." : newStatus === "dismissed" ? "Dismissed." : "Updated.", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
      fetchData();
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading your Security Action Center..." className="mt-16 py-16" />
      </DashboardLayout>
    );
  }

  if (status === "error" || !data) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <p className="text-sm text-ink">Some actions are temporarily unavailable.</p>
          <Button variant="outline" size="sm" className="mt-4" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={fetchData}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const visibleActions = data.actions.filter((a) => {
    if (!showCompleted && a.status === "completed") return false;
    if (priorityFilter && a.priority !== priorityFilter) return false;
    return true;
  });

  const hasOutstandingActions = data.actions.some((a) => a.status !== "completed");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <ListChecks className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Security Action Center</h1>
            <p className="text-sm text-ink-muted">Your personalized list of security actions, recommendations, and important updates.</p>
          </div>
        </div>

        {data.isNewUser ? (
          <div className="mt-8 flex flex-col gap-6">
            <Card className="p-6 text-center">
              <h2 className="font-display text-lg font-semibold text-ink">Welcome to CyberSentinel.</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Complete your first security check to begin building your personalized Security Action Center.
              </p>
            </Card>
            <QuickActions />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <OverviewMetric label="Critical" value={data.overview.critical} icon={Flame} color="#EF5A5A" />
              <OverviewMetric label="High Priority" value={data.overview.high} icon={AlertOctagon} color="#F5A623" />
              <OverviewMetric label="Recommended" value={data.overview.recommended} icon={Lightbulb} color="#4F7CFF" />
              <OverviewMetric label="Completed" value={data.overview.completed} icon={CheckCircle2} color="#22D3B8" />
            </div>

            <div className="mt-6">
              <QuickActions />
            </div>

            <div className="mt-8">
              <ActionFilters
                priority={priorityFilter}
                onPriorityChange={setPriorityFilter}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
              />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {!hasOutstandingActions ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <PartyPopper className="h-8 w-8 text-accent-secondary" />
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">You're all caught up.</p>
                    <p className="mt-1 text-sm text-ink-muted">No outstanding security actions right now.</p>
                  </div>
                </div>
              ) : visibleActions.length === 0 ? (
                <EmptyState icon={ListChecks} title="No actions match this filter" description="Try a different priority filter." />
              ) : (
                visibleActions.map((action) => (
                  <ActionCard key={action.actionKey} action={action} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Flame;
  color: string;
}) {
  return (
    <Card className="p-4 text-center">
      <Icon className="mx-auto h-4 w-4" style={{ color }} />
      <p className="mt-1.5 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{label}</p>
    </Card>
  );
}
