import { useCallback, useEffect, useState } from "react";
import {
  ShieldAlert,
  RotateCcw,
  Info,
  Search,
  Calendar,
  TrendingUp,
  ArrowUpDown,
  History,
  ExternalLink,
  Trash2,
  GraduationCap,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScanLoader } from "@/components/ScanLoader";
import { ReportSkeleton } from "@/components/ReportSkeleton";
import { ExpandableSection } from "@/components/ExpandableSection";
import { BreachReport } from "@/components/BreachReport";
import { DataBreachEducationTopics } from "@/components/DataBreachEducationTopics";
import { AIExplainButton } from "@/components/AIExplainButton";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/hooks/useToast";
import { validateEmail } from "@/utils/validateEmail";
import { checkBreach, BREACH_CHECK_STAGES } from "@/services/breachService";
import type { BreachCheckReport } from "@/services/breachService";
import {
  listBreachReports,
  getBreachReportRecord,
  deleteBreachReportRecord,
} from "@/services/breachHistoryService";
import type { BreachHistorySummary, BreachHistoryRecord } from "@/services/breachHistoryService";

type Status = "idle" | "scanning" | "done" | "error";

const RISK_COLOR: Record<string, string> = { low: "#22D3B8", moderate: "#4F7CFF", high: "#F5A623", severe: "#EF5A5A" };

export function DataBreachCheckerPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<BreachCheckReport | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useAuth();
  const { showToast } = useToast();

  const handleCheck = async () => {
    const validation = validateEmail(email);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    setStatus("scanning");
    try {
      const result = await checkBreach(validation.email);
      setReport(result.report);
      setSavedId(result.savedId);
      setStatus("done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setStatus("error");
      showToast(message, "error");
    }
  };

  const handleClear = () => {
    setEmail("");
    setReport(null);
    setStatus("idle");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <ShieldAlert className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Data Breach Checker</h1>
            <p className="text-sm text-ink-muted">Check whether an email address has appeared in known data breaches.</p>
          </div>
        </div>

        <Card glass className="mt-8 p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-3 text-xs text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-primary" />
            <span>
              Your email address is used to perform this security check. CyberSentinel will not display or store your
              password — we don't ask for one, because we never need it. The email is sent to our backend for this one
              check and to the breach-data provider we query; if you save the report, only a masked version of your
              email (like "j***@example.com") is stored, never the full address.
            </span>
          </div>

          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            disabled={status === "scanning"}
            rightElement={
              email ? (
                <button onClick={handleClear} aria-label="Clear email" className="pointer-events-auto text-ink-faint hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={handleCheck} isLoading={status === "scanning"}>
              {status === "scanning" ? "Checking..." : "Check for Breaches"}
            </Button>
            <Button variant="ghost" size="lg" onClick={handleClear} disabled={status === "scanning" || !email}>
              Clear
            </Button>
          </div>
        </Card>

        <p className="sr-only" role="status" aria-live="polite">
          {status === "scanning" && "Checking for breaches, please wait."}
          {status === "done" && report && (report.breachFound ? `Breaches found: ${report.breaches.length}.` : "No known breaches found.")}
          {status === "error" && `Check failed. ${errorMessage}`}
        </p>

        {status === "scanning" && (
          <div className="mt-8 flex flex-col gap-6">
            <ScanLoader messages={BREACH_CHECK_STAGES} />
            <ReportSkeleton />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center animate-fade-up">
            <p className="text-sm text-ink">{errorMessage}</p>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleCheck}>
              Try again
            </Button>
          </div>
        )}

        {status === "done" && report && (
          <div className="mt-8 animate-fade-up">
            <BreachReport report={report} savedId={savedId} />
            <div className="mt-4 flex justify-end">
              <AIExplainButton
                label="Ask AI to Explain This Result"
                explain={{ kind: "breach-result" }}
                prompt="Can you explain what my most recent breach check result means and what I should do about it?"
              />
            </div>
          </div>
        )}

        <div className="mt-10">
          <ExpandableSection title="Understanding Data Breaches" icon={GraduationCap} defaultOpen={false}>
            <DataBreachEducationTopics />
          </ExpandableSection>
        </div>

        {user && (
          <div className="mt-10">
            <PreviousBreachReportsSection />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

type SortBy = "date" | "risk";

function PreviousBreachReportsSection() {
  const [reports, setReports] = useState<BreachHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [openReport, setOpenReport] = useState<BreachHistoryRecord | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const reportModal = useDisclosure();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModal = useDisclosure();

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      setReports(await listBreachReports({ search: search || undefined, sortBy, sortDir }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load your reports.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [search, sortBy, sortDir, showToast]);

  useEffect(() => {
    const timeout = setTimeout(fetchReports, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortDir]);

  const handleOpen = async (id: string) => {
    setIsReportLoading(true);
    reportModal.open();
    try {
      setOpenReport(await getBreachReportRecord(id));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load that report.", "error");
      reportModal.close();
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteBreachReportRecord(pendingDeleteId);
      setReports((prev) => prev.filter((r) => r.id !== pendingDeleteId));
      showToast("Report deleted.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't delete that report.", "error");
    } finally {
      setPendingDeleteId(null);
      deleteModal.close();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <History className="h-4 w-4 text-ink-faint" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Previous Reports</h2>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input placeholder="Search by masked email..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={sortBy === "date" ? "secondary" : "outline"} size="md" onClick={() => setSortBy("date")} leftIcon={<Calendar className="h-4 w-4" />}>
            Date
          </Button>
          <Button variant={sortBy === "risk" ? "secondary" : "outline"} size="md" onClick={() => setSortBy("risk")} leftIcon={<TrendingUp className="h-4 w-4" />}>
            Risk
          </Button>
          <Button variant="outline" size="md" onClick={() => setSortDir((p) => (p === "asc" ? "desc" : "asc"))} aria-label="Toggle sort direction">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingSpinner label="Loading your reports..." className="py-10" />
        ) : reports.length === 0 ? (
          <EmptyState icon={History} title="No saved reports yet" description="Check an email above and save the results to see them here." />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                    style={{ color: RISK_COLOR[r.riskLevel], backgroundColor: `${RISK_COLOR[r.riskLevel]}1A` }}
                  >
                    {r.breachCount}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-ink">{r.maskedEmail}</p>
                    <p className="text-xs text-ink-faint">{new Date(r.checkedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" onClick={() => handleOpen(r.id)} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setPendingDeleteId(r.id); deleteModal.open(); }}
                    aria-label="Delete report"
                    className="text-ink-faint hover:text-accent-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={reportModal.isOpen} onClose={() => { reportModal.close(); setOpenReport(null); }} title="Breach Report" size="xl">
        {isReportLoading || !openReport ? (
          <LoadingSpinner label="Loading report..." className="py-16" />
        ) : (
          <BreachReport report={openReport.report} savedId={openReport.id} />
        )}
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => { deleteModal.close(); setPendingDeleteId(null); }} title="Delete this report?">
        <p className="text-sm text-ink-muted">This will permanently remove this report. This can't be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => { deleteModal.close(); setPendingDeleteId(null); }}>
            Cancel
          </Button>
          <Button variant="primary" className="bg-accent-danger bg-none hover:bg-accent-danger/90" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
