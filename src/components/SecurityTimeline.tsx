import { Globe2, FileSearch, Mail, KeySquare, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SecurityTimelineEntry, SecurityActivityType } from "@/services/securityCenterService";

interface SecurityTimelineProps {
  entries: SecurityTimelineEntry[];
}

const TYPE_ICON: Record<SecurityActivityType, LucideIcon> = {
  "website-scan": Globe2,
  "resume-analysis": FileSearch,
  "phishing-analysis": Mail,
  "password-assessment": KeySquare,
  "breach-check": ShieldAlert,
};

/** Risk is conveyed with both a label and a color — never color alone — for accessibility. */
const RISK_CONFIG: Record<NonNullable<SecurityTimelineEntry["riskLevel"]>, { color: string; label: string }> = {
  safe: { color: "#22D3B8", label: "Safe" },
  caution: { color: "#F5A623", label: "Caution" },
  risk: { color: "#EF5A5A", label: "Risk" },
};

export function SecurityTimeline({ entries }: SecurityTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">No recent activity to show yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry, index) => {
        const Icon = TYPE_ICON[entry.type];
        const risk = entry.riskLevel ? RISK_CONFIG[entry.riskLevel] : null;

        return (
          <li key={index} className="relative flex items-start gap-3">
            {index < entries.length - 1 && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-base-border" />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-elevated ring-1 ring-inset ring-base-border">
              <Icon className="h-3.5 w-3.5 text-accent-secondary" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-ink">{entry.label}</p>
                {risk && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ color: risk.color, backgroundColor: `${risk.color}1A` }}
                  >
                    {risk.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{entry.result}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{new Date(entry.date).toLocaleString()}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
