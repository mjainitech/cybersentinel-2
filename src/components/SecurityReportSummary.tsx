import { Clock, AlertCircle, Lock, LockOpen, ShieldQuestion } from "lucide-react";
import { Card } from "@/components/Card";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { SecurityBadge } from "@/components/SecurityBadge";
import { ScreenshotPlaceholder } from "@/components/ScreenshotPlaceholder";
import type { ScanReport, CheckStatus } from "@/services/scanService";

interface SecurityReportSummaryProps {
  report: ScanReport;
}

const legend = [
  { band: "safe" as const, label: "Safe", color: "#22D3B8" },
  { band: "warning" as const, label: "Use Caution", color: "#F5A623" },
  { band: "danger" as const, label: "Dangerous", color: "#EF5A5A" },
];

const sslConfig: Record<CheckStatus, { label: string; icon: typeof Lock; color: string }> = {
  safe: { label: "SSL Valid", icon: Lock, color: "#22D3B8" },
  warning: { label: "SSL Expiring Soon", icon: Lock, color: "#F5A623" },
  danger: { label: "SSL Invalid", icon: LockOpen, color: "#EF5A5A" },
  unknown: { label: "SSL Unknown", icon: ShieldQuestion, color: "#8891A5" },
};

const ratingColor: Record<ScanReport["rating"], string> = {
  A: "#22D3B8",
  B: "#22D3B8",
  C: "#F5A623",
  D: "#F5A623",
  F: "#EF5A5A",
};

const confidenceLabel: Record<ScanReport["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

/**
 * Header of the Security Report: overall score, letter rating,
 * confidence level, plain-language recommendation, a security badge
 * and SSL badge for at-a-glance status, and a legend explaining the
 * three risk bands so the color coding is self-explanatory even out
 * of context. Also surfaces report metadata from the backend: last
 * scan time, whether this result came from cache, and whether any
 * checks failed to complete (so the report never silently pretends
 * to be whole).
 */
export function SecurityReportSummary({ report }: SecurityReportSummaryProps) {
  const sslCheck = report.checks.find((check) => check.id === "ssl-certificate");
  const ssl = sslConfig[sslCheck?.status ?? "unknown"];
  const scannedAt = new Date(report.meta.scannedAt);

  return (
    <Card glass className="p-6 sm:p-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
        <div className="flex flex-col items-center gap-4">
          <RiskScoreGauge score={report.score} band={report.band} />
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border font-display text-sm font-bold"
            style={{ borderColor: `${ratingColor[report.rating]}50`, color: ratingColor[report.rating] }}
            aria-label={`Security rating: ${report.rating}`}
            title="Letter rating derived from the overall score"
          >
            {report.rating}
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{report.url}</p>
            {report.meta.cached && (
              <span className="inline-flex items-center gap-1 rounded-full bg-base-elevated px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                <Clock className="h-3 w-3" />
                Cached result
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-ink-faint">
            Last scanned {scannedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
            <span title="How much of this report could actually be verified">
              {confidenceLabel[report.confidence]}
            </span>
          </p>

          {/* Security badge + SSL badge — at-a-glance stamps, distinct from the numeric score */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <SecurityBadge band={report.band} />
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${ssl.color}40`, backgroundColor: `${ssl.color}14`, color: ssl.color }}
            >
              <ssl.icon className="h-3.5 w-3.5" />
              {ssl.label}
            </span>
          </div>

          <h2 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
            {report.recommendation}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Overall Recommendation is based on the {report.checks.length} checks below — expand any
            card to learn what it means and why it matters.
          </p>

          {report.meta.partial && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-warning/25 bg-accent-warning/10 p-3 text-left text-xs text-accent-warning">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {report.meta.unavailableChecks.length} of {report.checks.length} checks couldn't be
                completed and are marked "Unavailable" below — the score reflects only what could be verified.
              </span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            {legend.map((item) => (
              <div key={item.band} className="flex items-center gap-2 text-xs text-ink-muted">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: report.band === item.band ? `0 0 0 3px ${item.color}33` : undefined,
                  }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-40">
          <ScreenshotPlaceholder />
        </div>
      </div>
    </Card>
  );
}
