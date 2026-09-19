import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/Button";
import { AnalyticsFilter } from "@/components/AnalyticsFilter";
import { exportSecurityReportPdf, TIME_RANGE_LABELS } from "@/services/analyticsService";
import type { AnalyticsTimeRange } from "@/services/analyticsService";
import { downloadBlob } from "@/services/resumeScanService";
import { useToast } from "@/hooks/useToast";

interface ReportGeneratorProps {
  defaultRange: AnalyticsTimeRange;
}

export function ReportGenerator({ defaultRange }: ReportGeneratorProps) {
  const [range, setRange] = useState<AnalyticsTimeRange>(defaultRange);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const blob = await exportSecurityReportPdf(range);
      downloadBlob(blob, `cybersentinel-security-report-${range}.pdf`);
      showToast("Report downloaded.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong generating your report.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-faint">Choose the period this report should cover:</p>
      <AnalyticsFilter value={range} onChange={setRange} />
      <p className="text-xs text-ink-muted">Report period: {TIME_RANGE_LABELS[range]}</p>
      <Button onClick={handleGenerate} isLoading={isGenerating} leftIcon={<FileText className="h-4 w-4" />} className="self-start">
        Generate Security Report
      </Button>
      <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Download className="h-3 w-3" />
        Downloads as a PDF. Never includes passwords, leaked credentials, or raw breach data.
      </p>
    </div>
  );
}
