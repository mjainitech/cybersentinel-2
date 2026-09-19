import { Lock, LockOpen, ExternalLink, Trash2, Star } from "lucide-react";
import { Button } from "@/components/Button";
import type { ScanHistorySummary } from "@/services/scanHistoryService";
import { cn } from "@/utils/cn";

interface ScanHistoryItemProps {
  scan: ScanHistorySummary;
  onOpen: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  isCompareSelected: boolean;
  onToggleCompare: () => void;
  /** Disables the compare checkbox once two other scans are already selected. */
  compareDisabled?: boolean;
}

const bandColor: Record<ScanHistorySummary["band"], string> = {
  safe: "#22D3B8",
  warning: "#F5A623",
  danger: "#EF5A5A",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** One row in the Scan History list — summary fields only, opens the full report on demand. */
export function ScanHistoryItem({
  scan,
  onOpen,
  onDelete,
  onToggleFavorite,
  isCompareSelected,
  onToggleCompare,
  compareDisabled = false,
}: ScanHistoryItemProps) {
  const color = bandColor[scan.band];
  const isHttps = scan.httpsStatus === "safe";

  return (
    <div
      className={cn(
        "surface-card flex flex-col gap-4 p-5 transition-colors hover:border-accent-primary/30 sm:flex-row sm:items-center sm:justify-between",
        isCompareSelected && "border-accent-primary/50 ring-1 ring-inset ring-accent-primary/25"
      )}
    >
      <div className="flex items-start gap-4">
        <label className="mt-1 flex items-center" title="Select to compare with another scan">
          <input
            type="checkbox"
            checked={isCompareSelected}
            onChange={onToggleCompare}
            disabled={compareDisabled}
            aria-label={`Select scan of ${scan.url} for comparison`}
            className="h-4 w-4 rounded border-base-border bg-base-surface accent-accent-primary disabled:opacity-40"
          />
        </label>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ring-1 ring-inset"
          style={{ color, backgroundColor: `${color}1A`, boxShadow: `inset 0 0 0 1px ${color}40` }}
        >
          {scan.score}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-mono text-sm text-ink" title={scan.url}>
              {scan.url}
            </p>
            {isHttps ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-accent-secondary" />
            ) : (
              <LockOpen className="h-3.5 w-3.5 shrink-0 text-accent-danger" />
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{scan.recommendation}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <span>{formatDate(scan.scannedAt)}</span>
            <span className="h-1 w-1 rounded-full bg-base-border" />
            <span>{scan.apiResultsSummary}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <button
          onClick={onToggleFavorite}
          aria-label={scan.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={scan.favorite}
          className={cn(
            "rounded-lg p-2 transition-colors",
            scan.favorite ? "text-accent-warning" : "text-ink-faint hover:text-accent-warning"
          )}
        >
          <Star className="h-4 w-4" fill={scan.favorite ? "currentColor" : "none"} />
        </button>
        <Button variant="outline" size="sm" onClick={onOpen} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
          Open
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label="Delete scan"
          className="text-ink-faint hover:text-accent-danger"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
