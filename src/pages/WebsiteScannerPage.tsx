import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ScannerInputPanel } from "@/components/ScannerInputPanel";
import { ScanLoader } from "@/components/ScanLoader";
import { ReportSkeleton } from "@/components/ReportSkeleton";
import { ScanResultCard } from "@/components/ScanResultCard";
import { SecurityReportSummary } from "@/components/SecurityReportSummary";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { AIExplainButton } from "@/components/AIExplainButton";
import { RecommendationsList } from "@/components/RecommendationsList";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import { validateUrl } from "@/utils/validateUrl";
import { runWebsiteScan, scanStages, groupChecksByCategory, CATEGORY_LABELS } from "@/services/scanService";
import type { ScanReport } from "@/services/scanService";

type ScanStatus = "idle" | "scanning" | "done" | "error";

const EXAMPLE_URL = "https://example.com";

export function WebsiteScannerPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const handleScan = async (overrideUrl?: string) => {
    const validation = validateUrl(overrideUrl ?? url);

    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    setStatus("scanning");
    setReport(null);

    try {
      const result = await runWebsiteScan(validation.url);
      setReport(result);
      setStatus("done");

      if (result.meta.partial) {
        showToast("Some checks couldn't be completed this time — see the report for details.", "info");
      }
    } catch (error) {
      // A TypeError from fetch itself (not an HTTP error response) means the
      // backend couldn't be reached at all — give a more actionable message.
      const message =
        error instanceof TypeError
          ? "Couldn't reach the scanning service. Make sure the backend server is running."
          : error instanceof Error
          ? error.message
          : "Something went wrong while scanning. Please try again.";

      setErrorMessage(message);
      setStatus("error");
      showToast(message, "error");
    }
  };

  // Lets other features (e.g. the Email Phishing Analyzer's "Analyze this link")
  // deep-link straight into a scan via /dashboard/url-scanner?url=... — additive
  // only, doesn't change any behavior for the page's normal manual-entry flow.
  useEffect(() => {
    const linkedUrl = searchParams.get("url");
    if (linkedUrl) {
      setUrl(linkedUrl);
      handleScan(linkedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseExample = () => setUrl(EXAMPLE_URL);

  const handleClear = () => {
    setUrl("");
    setReport(null);
    setStatus("idle");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Globe2 className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Website Scanner</h1>
            <p className="text-sm text-ink-muted">
              Paste a link to check it for phishing signals, unsafe redirects, and reputation issues.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <ScannerInputPanel
            value={url}
            onChange={setUrl}
            onScan={() => handleScan()}
            onUseExample={handleUseExample}
            onClear={handleClear}
            isScanning={status === "scanning"}
          />
        </div>

        {/* Announces scan progress to screen readers without needing visual focus to move. */}
        <p className="sr-only" role="status" aria-live="polite">
          {status === "scanning" && "Scanning website, please wait."}
          {status === "done" && report && `Scan complete. ${report.recommendation}`}
          {status === "error" && `Scan failed. ${errorMessage}`}
        </p>

        {status === "scanning" && (
          <div className="mt-8 flex flex-col gap-6">
            <ScanLoader messages={scanStages} />
            <ReportSkeleton />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-accent-danger/25 bg-accent-danger/10 p-8 text-center animate-fade-up">
            <p className="text-sm text-ink">{errorMessage}</p>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => handleScan()}>
              Try again
            </Button>
          </div>
        )}

        {status === "done" && report && (
          <div className="mt-8 flex flex-col gap-6 animate-fade-up">
            <SecurityReportSummary report={report} />
            <div className="flex justify-end">
              <AIExplainButton
                label="Explain This Result"
                explain={{ kind: "website-scan" }}
                prompt={`Can you explain my most recent website scan result for ${report.url}?`}
              />
            </div>

            <AiExplanationCard explanation={report.aiExplanation} />

            <RecommendationsList recommendations={report.recommendations} />

            {groupChecksByCategory(report.checks).map(({ category, checks }) => (
              <div key={category}>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {checks.map((check, index) => (
                    <ScanResultCard
                      key={check.id}
                      icon={check.icon}
                      title={check.title}
                      value={check.value}
                      summary={check.summary}
                      learnMore={check.learnMore}
                      glossary={check.glossary}
                      status={check.status}
                      meta={check.meta}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
