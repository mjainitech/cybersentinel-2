import { Link } from "react-router-dom";
import type { CveRecord } from "@/services/threatService";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";

interface CVECardProps {
  cve: CveRecord;
}

export function CVECard({ cve }: CVECardProps) {
  return (
    <Link
      to={`/threat-intelligence/${cve.id}`}
      className="surface-card flex flex-col gap-3 p-5 transition-colors hover:border-accent-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-accent-primary">{cve.id}</span>
          {cve.cvssScore !== null && <span className="ml-2 font-mono text-[11px] text-ink-faint">CVSS {cve.cvssScore.toFixed(1)}</span>}
        </div>
        <ThreatSeverityBadge severity={cve.severity} />
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{cve.description}</p>

      {cve.affectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cve.affectedProducts.slice(0, 4).map((product) => (
            <span key={product} className="rounded-full bg-base-elevated px-2 py-0.5 text-[11px] capitalize text-ink-faint">
              {product}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-ink-faint">
        Published {cve.publishedDate ? new Date(cve.publishedDate).toLocaleDateString() : "Unknown"}
      </p>
    </Link>
  );
}
