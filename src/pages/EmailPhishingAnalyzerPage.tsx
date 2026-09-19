import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  RotateCcw,
  Download,
  Search,
  Calendar,
  Gauge,
  ArrowUpDown,
  History,
  ExternalLink,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Globe2,
  Paperclip,
  GraduationCap,
  FileSearch,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScanLoader } from "@/components/ScanLoader";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { EmailInputPanel } from "@/components/EmailInputPanel";
import type { EmailInputMethod } from "@/components/EmailInputPanel";
import { EmailRiskMeter } from "@/components/EmailRiskMeter";
import { EmailContentHighlighter } from "@/components/EmailContentHighlighter";
import { EmailLinkAnalysisList } from "@/components/EmailLinkAnalysisList";
import { EmailAttachmentCard } from "@/components/EmailAttachmentCard";
import { PhishingEducationTips } from "@/components/PhishingEducationTips";
import { ExpandableSection } from "@/components/ExpandableSection";
import { AIExplainButton } from "@/components/AIExplainButton";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/hooks/useToast";
import { analyzeEmail, exportEmailReportPdf, EMAIL_ANALYSIS_STAGES } from "@/services/emailAnalysisService";
import type { EmailAnalysisReport } from "@/services/emailAnalysisService";
import { downloadBlob } from "@/services/resumeScanService";
import {
  listEmailReports,
  getEmailReportRecord,
  deleteEmailReportRecord,
  exportSavedEmailReportPdf,
} from "@/services/emailHistoryService";
import type { EmailHistorySummary } from "@/services/emailHistoryService";

type Status = "idle" | "analyzing" | "done" | "error";

const classificationColor: Record<EmailHistorySummary["classification"], string> = {
  "likely-safe": "#22D3B8",
  "use-caution": "#4F7CFF",
  suspicious: "#F5A623",
  "likely-phishing": "#EF5A5A",
};

export function EmailPhishingAnalyzerPage() {
  const [method, setMethod] = useState<EmailInputMethod>("text");
  const [content, setContent] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<EmailAnalysisReport | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    setStatus("analyzing");

    try {
      const result = await analyzeEmail({
        inputMethod: method,
        content: method === "screenshot" ? undefined : content,
        screenshotFile: method === "screenshot" ? screenshotFile ?? undefined : undefined,
        attachmentFile: attachmentFile ?? undefined,
      });
      setReport(result.report);
      setSavedId(result.savedId);
      setStatus("done");

      if (result.report.lowTextWarning) {
        showToast("Very little text could be read from that screenshot — results may be incomplete.", "info");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong analyzing this email.";
      setErrorMessage(message);
      setStatus("error");
      showToast(message, "error");
    }
  };

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const blob = await exportEmailReportPdf(report);
      downloadBlob(blob, "email-phishing-report.pdf");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't export that report.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Mail className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Email Phishing Analyzer</h1>
            <p className="text-sm text-ink-muted">
              Paste an email, upload a screenshot, or paste raw headers to check for signs of phishing.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <EmailInputPanel
            method={method}
            onMethodChange={(next) => {
              setMethod(next);
              setStatus("idle");
              setReport(null);
            }}
            content={content}
            onContentChange={setContent}
            screenshotFile={screenshotFile}
            onScreenshotSelect={(file) => {
              setScreenshotFile(file);
              setStatus("idle");
              setReport(null);
            }}
            attachmentFile={attachmentFile}
            onAttachmentSelect={setAttachmentFile}
            onAnalyze={handleAnalyze}
            isAnalyzing={status === "analyzing"}
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {status === "analyzing" && "Analyzing email, please wait."}
          {status === "done" && report && `Analysis complete. Risk score ${report.riskScore} out of 100.`}
          {status === "error" && `Analysis failed. ${errorMessage}`}
        </p>

        {status === "analyzing" && <ScanLoader messages={EMAIL_ANALYSIS_STAGES} className="mt-8" />}

        {status === "error" && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center animate-fade-up">
            <p className="text-sm text-ink">{errorMessage}</p>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleAnalyze}>
              Try again
            </Button>
          </div>
        )}

        {status === "done" && report && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col gap-6"
          >
            <div className="surface-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-10 sm:p-8">
              <EmailRiskMeter score={report.riskScore} classification={report.classification} />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{report.aiExplanation.verdict}</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {report.indicators.length} indicator{report.indicators.length === 1 ? "" : "s"} detected across this email.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Button size="sm" onClick={handleExport} isLoading={isExporting} leftIcon={<Download className="h-3.5 w-3.5" />}>
                    Export as PDF
                  </Button>
                  {savedId && user && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-secondary/10 px-2.5 py-1 text-xs font-medium text-accent-secondary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Saved to your reports
                    </span>
                  )}
                  <AIExplainButton
                    label="Ask AI to Explain"
                    explain={{ kind: "phishing-result" }}
                    prompt="Can you explain my most recent email phishing analysis result?"
                  />
                </div>
              </div>
            </div>

            {report.lowTextWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-accent-warning/25 bg-accent-warning/10 p-3 text-xs text-accent-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Very little readable text was found in that screenshot — detection results may be incomplete.</span>
              </div>
            )}

            <ExpandableSection title="Highlighted Findings" icon={FileSearch}>
              <p className="mb-3 text-xs text-ink-faint">Hover over a highlighted section to see why it was flagged.</p>
              <EmailContentHighlighter text={report.analyzedText} indicators={report.indicators} />
            </ExpandableSection>

            <ExpandableSection title="AI Explanation" icon={Sparkles}>
              <AiExplanationCard explanation={report.aiExplanation} />
            </ExpandableSection>

            <ExpandableSection title="Link Analysis" icon={Globe2}>
              <EmailLinkAnalysisList links={report.links} />
            </ExpandableSection>

            {report.attachment && (
              <ExpandableSection title="Attachment" icon={Paperclip}>
                <EmailAttachmentCard attachment={report.attachment} />
              </ExpandableSection>
            )}

            <ExpandableSection title="Why This Looks Suspicious" icon={GraduationCap} defaultOpen={false}>
              <PhishingEducationTips />
            </ExpandableSection>
          </motion.div>
        )}

        {user && (
          <div className="mt-10">
            <PreviousEmailReportsSection />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

type SortBy = "date" | "score";

function PreviousEmailReportsSection() {
  const [reports, setReports] = useState<EmailHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [openReport, setOpenReport] = useState<EmailAnalysisReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const reportModal = useDisclosure();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModal = useDisclosure();

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await listEmailReports({ search: search || undefined, sortBy, sortDir });
      setReports(results);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load your email reports.", "error");
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
      const record = await getEmailReportRecord(id);
      setOpenReport(record.report);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load that report.", "error");
      reportModal.close();
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleExportSaved = async (id: string) => {
    try {
      const blob = await exportSavedEmailReportPdf(id);
      downloadBlob(blob, `email-report-${id}.pdf`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't export that report.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteEmailReportRecord(pendingDeleteId);
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
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={sortBy === "date" ? "secondary" : "outline"} size="md" onClick={() => setSortBy("date")} leftIcon={<Calendar className="h-4 w-4" />}>
            Date
          </Button>
          <Button variant={sortBy === "score" ? "secondary" : "outline"} size="md" onClick={() => setSortBy("score")} leftIcon={<Gauge className="h-4 w-4" />}>
            Score
          </Button>
          <Button variant="outline" size="md" onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))} aria-label="Toggle sort direction">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingSpinner label="Loading your reports..." className="py-10" />
        ) : reports.length === 0 ? (
          <EmptyState icon={History} title="No reports yet" description="Analyze an email above and it'll show up here automatically." />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                    style={{ color: classificationColor[r.classification], backgroundColor: `${classificationColor[r.classification]}1A` }}
                  >
                    {r.riskScore}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-faint">{new Date(r.analyzedAt).toLocaleDateString()}</p>
                    <p className="truncate text-sm text-ink">{r.summary}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" onClick={() => handleOpen(r.id)} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportSaved(r.id)} aria-label="Export PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingDeleteId(r.id);
                      deleteModal.open();
                    }}
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

      <Modal
        isOpen={reportModal.isOpen}
        onClose={() => {
          reportModal.close();
          setOpenReport(null);
        }}
        title="Email Analysis Report"
        size="xl"
      >
        {isReportLoading || !openReport ? (
          <LoadingSpinner label="Loading report..." className="py-16" />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="surface-card flex flex-col items-center gap-6 p-5 sm:flex-row">
              <EmailRiskMeter score={openReport.riskScore} classification={openReport.classification} />
              <p className="text-center text-sm text-ink sm:text-left">{openReport.aiExplanation.verdict}</p>
            </div>
            <ExpandableSection title="Highlighted Findings" icon={FileSearch}>
              <EmailContentHighlighter text={openReport.analyzedText} indicators={openReport.indicators} />
            </ExpandableSection>
            <ExpandableSection title="AI Explanation" icon={Sparkles}>
              <AiExplanationCard explanation={openReport.aiExplanation} />
            </ExpandableSection>
            <ExpandableSection title="Link Analysis" icon={Globe2}>
              <EmailLinkAnalysisList links={openReport.links} />
            </ExpandableSection>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.close();
          setPendingDeleteId(null);
        }}
        title="Delete this report?"
      >
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
