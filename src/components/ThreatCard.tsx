import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { ThreatEntry } from "@/services/threatService";
import { CATEGORY_LABELS } from "@/services/threatService";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";

interface ThreatCardProps {
  threat: ThreatEntry;
}

export function ThreatCard({ threat }: ThreatCardProps) {
  return (
    <Link
      to={`/threat-intelligence/${threat.id}`}
      className="surface-card flex flex-col gap-3 p-5 transition-colors hover:border-accent-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{CATEGORY_LABELS[threat.category]}</span>
          <h3 className="mt-1 font-display text-sm font-semibold text-ink">{threat.title}</h3>
        </div>
        <ThreatSeverityBadge severity={threat.severity} />
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">{threat.shortDescription}</p>

      <div className="flex items-center justify-between text-[11px] text-ink-faint">
        <span>Published {new Date(threat.publishedDate).toLocaleDateString()}</span>
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          {threat.source.name}
        </span>
      </div>
    </Link>
  );
}
