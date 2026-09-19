import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileSearch,
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
  Lightbulb,
  ListChecks,
  GraduationCap,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScanLoader } from "@/components/ScanLoader";
import { ResumeUploadPanel } from "@/components/ResumeUploadPanel";
import { PrivacyScoreGauge } from "@/components/PrivacyScoreGauge";
import { DetectedInfoList } from "@/components/DetectedInfoList";
import { ResumeAiReviewCard } from "@/components/ResumeAiReviewCard";
import { ResumeRecommendationsList } from "@/components/ResumeRecommendationsList";
import { RiskBreakdown } from "@/components/RiskBreakdown";
import { EducationalTips } from "@/components/EducationalTips";
import { ExpandableSection } from "@/components/ExpandableSection";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/hooks/useToast";
import {
  analyzeResume,
  exportResumeReportPdf,
  downloadBlob,
  RESUME_ANALYSIS_STAGES,
} from "@/services/resumeScanService";
import type { ResumePrivacyReport } from "@/services/resumeScanService";
import {
  listResumeReports,
  getResumeReportRecord,
  deleteResumeReportRecord,
  exportSavedResumeReportPdf,
} from "@/services/resumeHistoryService";
import type { ResumeReportSummary } from "@/services/resumeHistoryService";

type Status = "idle" | "analyzing" | "done" | "error";

const ratingBorderColor: Record<ResumeReportSummary["privacyRating"], string> = {
  excellent: "#22D3B8",
  good: "#4F7CFF",
  "needs-improvement": "#F5A623",
  "high-risk": "#EF5A5A",
};

export function ResumePrivacyScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [report, setReport] = useState<ResumePrivacyReport | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setUploadProgress(0);

    try {
      const result = await analyzeResume(file, setUploadProgress);
      setReport(result.report);
      setSavedId(result.savedId);
      setStatus("done");

      if (result.report.lowTextWarning) {
        showToast(
          "This PDF had very little readable text — it may be a scanned image. Results may be incomplete.",
          "info"
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong analyzing your resume. Please try again.";
      setErrorMessage(message);
      setStatus("error");
      showToast(message, "error");
    }
  };

  const handleRemove = () => {
    setFile(null);
    setReport(null);
    setStatus("idle");
  };

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const blob = await exportResumeReportPdf(report);
      downloadBlob(blob, `privacy-report-${report.fileName.replace(/\.pdf$/i, "")}.pdf`);
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
            <FileSearch className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Resume Privacy Scanner</h1>
            <p className="text-sm text-ink-muted">
              Upload your resume to see what personal information it exposes, and how to share it more safely.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <ResumeUploadPanel
            file={file}
            onFileSelect={(selected) => {
              setFile(selected);
              setReport(null);
              setStatus("idle");
            }}
            onRemove={handleRemove}
            onAnalyze={handleAnalyze}
            isAnalyzing={status === "analyzing"}
            uploadProgress={uploadProgress}
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {status === "analyzing" && "Analyzing resume, please wait."}
          {status === "done" && report && `Analysis complete. Privacy score ${report.privacyScore} out of 100.`}
          {status === "error" && `Analysis failed. ${errorMessage}`}
        </p>

        {status === "analyzing" && <ScanLoader messages={RESUME_ANALYSIS_STAGES} className="mt-8" />}

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
            {/* Score summary */}
            <div className="surface-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-10 sm:p-8">
              <PrivacyScoreGauge score={report.privacyScore} rating={report.privacyRating} />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{report.fileName}</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
                  {report.aiReview.summary}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {report.detected.length} item{report.detected.length === 1 ? "" : "s"} detected across this resume.
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
                </div>
              </div>
            </div>

            {report.lowTextWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-accent-warning/25 bg-accent-warning/10 p-3 text-xs text-accent-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Very little readable text was found in this PDF — it may be a scanned image rather than real text.
                  Detection results may be incomplete.
                </span>
              </div>
            )}

            <ExpandableSection title="Detected Information" icon={FileSearch}>
              <DetectedInfoList detected={report.detected} />
            </ExpandableSection>

            <ExpandableSection title="AI Privacy Review" icon={Sparkles}>
              <ResumeAiReviewCard review={report.aiReview} />
            </ExpandableSection>

            <ExpandableSection title="Recommendations" icon={Lightbulb}>
              <ResumeRecommendationsList recommendations={report.recommendations} />
            </ExpandableSection>

            <ExpandableSection title="Risk Breakdown" icon={ListChecks} defaultOpen={false}>
              <RiskBreakdown detected={report.detected} />
            </ExpandableSection>

            <ExpandableSection title="Educational Tips" icon={GraduationCap} defaultOpen={false}>
              <EducationalTips />
            </ExpandableSection>
          </motion.div>
        )}

        {/* Previous reports — only meaningful for signed-in users */}
        {user && (
          <div className="mt-10">
            <PreviousReportsSection />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

type SortBy = "date" | "score";

function PreviousReportsSection() {
  const [reports, setReports] = useState<ResumeReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [openReport, setOpenReport] = useState<ResumePrivacyReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const reportModal = useDisclosure();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModal = useDisclosure();

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await listResumeReports({ search: search || undefined, sortBy, sortDir });
      setReports(results);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't load your resume reports.", "error");
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
      const record = await getResumeReportRecord(id);
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
      const blob = await exportSavedResumeReportPdf(id);
      downloadBlob(blob, `privacy-report-${id}.pdf`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't export that report.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteResumeReportRecord(pendingDeleteId);
      setReports((prev) => prev.filter((report) => report.id !== pendingDeleteId));
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
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">
          Previous Reports
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "date" ? "secondary" : "outline"}
            size="md"
            onClick={() => setSortBy("date")}
            leftIcon={<Calendar className="h-4 w-4" />}
          >
            Date
          </Button>
          <Button
            variant={sortBy === "score" ? "secondary" : "outline"}
            size="md"
            onClick={() => setSortBy("score")}
            leftIcon={<Gauge className="h-4 w-4" />}
          >
            Score
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            aria-label="Toggle sort direction"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingSpinner label="Loading your reports..." className="py-10" />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={History}
            title="No reports yet"
            description="Analyze a resume above and it'll show up here automatically."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                    style={{
                      color: ratingBorderColor[report.privacyRating],
                      backgroundColor: `${ratingBorderColor[report.privacyRating]}1A`,
                    }}
                  >
                    {report.privacyScore}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink" title={report.fileName}>
                      {report.fileName}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {new Date(report.analyzedAt).toLocaleDateString()} · {report.summary}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" onClick={() => handleOpen(report.id)} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportSaved(report.id)} aria-label="Export PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingDeleteId(report.id);
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
        title="Privacy Report"
        size="xl"
      >
        {isReportLoading || !openReport ? (
          <LoadingSpinner label="Loading report..." className="py-16" />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="surface-card flex flex-col items-center gap-6 p-5 sm:flex-row">
              <PrivacyScoreGauge score={openReport.privacyScore} rating={openReport.privacyRating} />
              <div className="text-center sm:text-left">
                <p className="font-mono text-xs text-ink-faint">{openReport.fileName}</p>
                <p className="mt-1 text-sm text-ink">{openReport.aiReview.summary}</p>
              </div>
            </div>
            <ExpandableSection title="Detected Information" icon={FileSearch}>
              <DetectedInfoList detected={openReport.detected} />
            </ExpandableSection>
            <ExpandableSection title="AI Privacy Review" icon={Sparkles}>
              <ResumeAiReviewCard review={openReport.aiReview} />
            </ExpandableSection>
            <ExpandableSection title="Recommendations" icon={Lightbulb}>
              <ResumeRecommendationsList recommendations={openReport.recommendations} />
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
          <Button
            variant="ghost"
            onClick={() => {
              deleteModal.close();
              setPendingDeleteId(null);
            }}
          >
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
