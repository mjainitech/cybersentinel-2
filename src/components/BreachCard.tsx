import { AlertTriangle, Lock, Calendar } from "lucide-react";
import type { BreachRecord } from "@/services/breachService";
import { EXPOSURE_CATEGORY_LABELS } from "@/services/breachService";

interface BreachCardProps {
  breach: BreachRecord;
}

/** One known breach. Never renders any leaked data itself — only the breach's metadata and which categories of information it exposed. */
export function BreachCard({ breach }: BreachCardProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">{breach.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
            <Calendar className="h-3 w-3" />
            Breach date: {breach.breachDate || "Unknown"} · Domain: {breach.domain}
          </p>
        </div>
        {breach.isSensitive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-danger/10 px-2 py-1 text-[11px] font-medium text-accent-danger">
            <AlertTriangle className="h-3 w-3" />
            Sensitive
          </span>
        )}
      </div>

      {breach.isPasswordExposed && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent-danger/25 bg-accent-danger/10 p-2.5 text-xs text-accent-danger">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Passwords were reported as exposed in this breach — never displayed here, but worth changing immediately.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {breach.exposedCategories.map((category) => (
          <span key={category} className="rounded-full bg-base-elevated px-2.5 py-1 text-[11px] text-ink-muted">
            {EXPOSURE_CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>
    </div>
  );
}
