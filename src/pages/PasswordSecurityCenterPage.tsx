import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeySquare,
  Eye,
  EyeOff,
  X,
  Save,
  Download,
  Wand2,
  Type,
  GraduationCap,
  ListChecks,
  History,
  ExternalLink,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ExpandableSection } from "@/components/ExpandableSection";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { PasswordChecklist } from "@/components/PasswordChecklist";
import { ResumeRecommendationsList } from "@/components/ResumeRecommendationsList";
import { PasswordGeneratorPanel } from "@/components/PasswordGeneratorPanel";
import { PassphraseGeneratorPanel } from "@/components/PassphraseGeneratorPanel";
import { PasswordEducationTopics } from "@/components/PasswordEducationTopics";
import { AccountSecurityChecklist } from "@/components/AccountSecurityChecklist";
import { AIExplainButton } from "@/components/AIExplainButton";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/hooks/useToast";
import { analyzePassword } from "@/utils/passwordAnalysis";
import {
  savePasswordReport,
  listPasswordReports,
  getPasswordReportRecord,
  deletePasswordReportRecord,
  exportPasswordReportPdf,
} from "@/services/passwordHistoryService";
import type { PasswordHistorySummary, PasswordHistoryRecord, PasswordChecklistState } from "@/services/passwordHistoryService";
import { downloadBlob } from "@/services/resumeScanService";

const RATING_LABELS: Record<string, string> = {
  "very-weak": "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  excellent: "Excellent",
};

export function PasswordSecurityCenterPage() {
  // The one and only place the raw password string lives. Never sent
  // anywhere, never logged — see utils/passwordAnalysis.ts for the
  // analysis itself, which also runs entirely in this browser tab.
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [checklistState, setChecklistState] = useState<PasswordChecklistState | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

  const analysis = useMemo(() => (password ? analyzePassword(password) : null), [password]);

  const handleClear = () => setPassword("");

  const handleSave = async () => {
    if (!analysis || !checklistState) return;
    setIsSaving(true);
    try {
      await savePasswordReport({
        score: analysis.score,
        rating: analysis.rating,
        recommendations: analysis.recommendations.map((r) => r.text),
        checklist: checklistState,
      });
      showToast("Saved — your password itself was never sent or stored.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't save that report.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <KeySquare className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Password Security Center</h1>
            <p className="text-sm text-ink-muted">
              Check password strength, generate stronger ones, and build better habits — all analyzed on your device.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-accent-secondary">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Nothing you type here is ever sent over the network. Analysis happens entirely in your browser.</span>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <ExpandableSection title="Password Analyzer" icon={KeySquare}>
            <div className="flex flex-col gap-5">
              <Input
                type={showPassword ? "text" : "password"}
                label="Enter a password to check"
                placeholder="Type a password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                aria-describedby="password-analysis-status"
                rightElement={
                  <div className="pointer-events-auto flex items-center gap-1">
                    {password && (
                      <button onClick={handleClear} aria-label="Clear password" className="text-ink-faint hover:text-ink">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="text-ink-faint hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                }
              />

              <p id="password-analysis-status" className="sr-only" role="status" aria-live="polite">
                {analysis ? `Password strength: ${RATING_LABELS[analysis.rating]}, score ${analysis.score} out of 100.` : ""}
              </p>

              {analysis ? (
                <>
                  <PasswordStrengthMeter score={analysis.score} rating={analysis.rating} resistanceDescription={analysis.resistanceDescription} />
                  <PasswordChecklist checks={analysis.checks} />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Recommendations</h3>
                    <div className="mt-2.5">
                      <ResumeRecommendationsList recommendations={analysis.recommendations} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <AIExplainButton
                      label="Ask AI to Explain My Score"
                      explain={{ kind: "password-score" }}
                      prompt="Can you explain my password security score and what I should improve?"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-3.5 w-3.5" />} disabled={!user}>
                      Save Results (no password saved)
                    </Button>
                    {!user && <span className="text-xs text-ink-faint">Sign in to save your results.</span>}
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-faint">Start typing to see a real-time strength analysis.</p>
              )}
            </div>
          </ExpandableSection>

          <ExpandableSection title="Password Generator" icon={Wand2} defaultOpen={false}>
            <PasswordGeneratorPanel />
          </ExpandableSection>

          <ExpandableSection title="Passphrase Generator" icon={Type} defaultOpen={false}>
            <PassphraseGeneratorPanel />
          </ExpandableSection>

          <ExpandableSection title="Account Security Checklist" icon={ListChecks} defaultOpen={false}>
            <AccountSecurityChecklist onChange={(state) => setChecklistState(state)} />
          </ExpandableSection>

          <ExpandableSection title="Password Education" icon={GraduationCap} defaultOpen={false}>
            <PasswordEducationTopics />
          </ExpandableSection>

          {user && (
            <div>
              <PreviousPasswordReportsSection />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function PreviousPasswordReportsSection() {
  const [reports, setReports] = useState<PasswordHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openReport, setOpenReport] = useState<PasswordHistoryRecord | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const reportModal = useDisclosure();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModal = useDisclosure();

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      setReports(await listPasswordReports({ sortBy: "date", sortDir: "desc" }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load your reports.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpen = async (id: string) => {
    setIsReportLoading(true);
    reportModal.open();
    try {
      setOpenReport(await getPasswordReportRecord(id));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load that report.", "error");
      reportModal.close();
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const blob = await exportPasswordReportPdf(id);
      downloadBlob(blob, `password-report-${id}.pdf`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't export that report.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deletePasswordReportRecord(pendingDeleteId);
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

      <div className="mt-4">
        {isLoading ? (
          <LoadingSpinner label="Loading your reports..." className="py-10" />
        ) : reports.length === 0 ? (
          <EmptyState icon={History} title="No saved reports yet" description="Analyze a password above and save the results to see them here." />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                    {r.score}
                  </div>
                  <div>
                    <p className="text-sm text-ink">{RATING_LABELS[r.rating]}</p>
                    <p className="text-xs text-ink-faint">
                      {new Date(r.analyzedAt).toLocaleDateString()} · Checklist {r.checklistCompletionPercent}% complete
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" onClick={() => handleOpen(r.id)} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport(r.id)} aria-label="Export PDF">
                    <Download className="h-4 w-4" />
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

      <Modal isOpen={reportModal.isOpen} onClose={() => { reportModal.close(); setOpenReport(null); }} title="Password Security Report">
        {isReportLoading || !openReport ? (
          <LoadingSpinner label="Loading report..." className="py-16" />
        ) : (
          <div className="flex flex-col gap-5">
            <PasswordStrengthMeter
              score={openReport.score}
              rating={openReport.rating}
              resistanceDescription={`${RATING_LABELS[openReport.rating]} password from your history.`}
            />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Recommendations</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-muted">
                {openReport.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
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
