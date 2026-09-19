import { ArrowRight, Minus } from "lucide-react";
import type { ScanReport } from "@/services/scanService";
import { cn } from "@/utils/cn";

interface CompareScansModalProps {
  reportA: ScanReport;
  reportB: ScanReport;
}

const statusColor: Record<string, string> = {
  safe: "#22D3B8",
  warning: "#F5A623",
  danger: "#EF5A5A",
  unknown: "#8891A5",
};

/**
 * Side-by-side view of two saved scans — useful for comparing the
 * same site over time, or two different sites. Checks are matched by
 * id; anything present in one report but not the other is called out
 * rather than silently skipped.
 */
export function CompareScansModal({ reportA, reportB }: CompareScansModalProps) {
  const allCheckIds = Array.from(new Set([...reportA.checks.map((c) => c.id), ...reportB.checks.map((c) => c.id)]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {[reportA, reportB].map((report, index) => (
          <div key={index} className="surface-card p-4 text-center">
            <p className="truncate font-mono text-xs text-ink-faint" title={report.url}>
              {report.url}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold" style={{ color: statusColor[report.band] }}>
              {report.score}
            </p>
            <p className="mt-1 text-xs text-ink-muted">{report.recommendation}</p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {new Date(report.meta.scannedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium"
        style={{
          color: reportB.score >= reportA.score ? "#22D3B8" : "#EF5A5A",
          backgroundColor: reportB.score >= reportA.score ? "#22D3B814" : "#EF5A5A14",
        }}
      >
        {reportB.score === reportA.score ? (
          <>
            <Minus className="h-4 w-4" /> Same score
          </>
        ) : (
          <>
            <ArrowRight className="h-4 w-4" />
            Score {reportB.score > reportA.score ? "improved" : "dropped"} by {Math.abs(reportB.score - reportA.score)} points
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {allCheckIds.map((id) => {
          const checkA = reportA.checks.find((c) => c.id === id);
          const checkB = reportB.checks.find((c) => c.id === id);
          const title = checkA?.title ?? checkB?.title ?? id;
          const differs = checkA?.status !== checkB?.status;

          return (
            <div
              key={id}
              className={cn(
                "grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border p-3 text-xs",
                differs ? "border-accent-primary/30 bg-accent-primary/5" : "border-base-border"
              )}
            >
              <div className="flex items-center justify-end gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: checkA ? statusColor[checkA.status] : "#232B3D" }}
                />
                <span className="text-ink-muted">{checkA ? checkA.value : "Not present"}</span>
              </div>
              <span className="text-center font-medium text-ink">{title}</span>
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">{checkB ? checkB.value : "Not present"}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: checkB ? statusColor[checkB.status] : "#232B3D" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
