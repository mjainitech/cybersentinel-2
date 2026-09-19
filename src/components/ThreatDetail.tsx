import { ShieldCheck, Sparkles, ExternalLink, ShieldAlert } from "lucide-react";
import type { ThreatDetailResponse } from "@/services/threatService";
import { CATEGORY_LABELS } from "@/services/threatService";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";
import { ThreatTimeline } from "@/components/ThreatTimeline";
import { ThreatBookmark } from "@/components/ThreatBookmark";
import { ThreatRecommendation } from "@/components/ThreatRecommendation";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { ExpandableSection } from "@/components/ExpandableSection";

interface ThreatDetailProps {
  detail: ThreatDetailResponse;
}

/**
 * Renders either a curated ThreatEntry or a live CveRecord. The
 * "Verified Information" section always comes straight from the
 * source (curated content or NVD) with zero AI involvement; the "AI
 * Explanation" section is clearly separated and labeled — see the
 * spec's requirement to distinguish verified data from AI-generated
 * interpretation.
 */
export function ThreatDetail({ detail }: ThreatDetailProps) {
  const { item, aiExplanation, recommendations, isBookmarked } = detail;

  const title = item.kind === "curated" ? item.title : item.id;
  const severity = item.severity;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {item.kind === "curated" && (
            <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{CATEGORY_LABELS[item.category]}</span>
          )}
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <ThreatSeverityBadge severity={severity} />
            {item.kind === "cve" && item.cvssScore !== null && (
              <span className="font-mono text-xs text-ink-faint">CVSS {item.cvssScore.toFixed(1)}</span>
            )}
          </div>
        </div>
        <ThreatBookmark threatId={item.id} isBookmarked={isBookmarked} />
      </div>

      <div className="surface-card p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-secondary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified Information
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
          {item.kind === "curated" ? item.fullDescription : item.description}
        </p>

        {item.kind === "cve" && item.affectedProducts.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-ink-faint">Affected Products</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.affectedProducts.map((product) => (
                <span key={product} className="rounded-full bg-base-elevated px-2 py-0.5 text-[11px] capitalize text-ink-muted">
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        <a
          href={item.kind === "curated" ? item.source.url : item.referenceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-primary hover:text-accent-secondary"
        >
          <ExternalLink className="h-3 w-3" />
          Source: {item.kind === "curated" ? item.source.name : "NVD — National Vulnerability Database"}
        </a>
      </div>

      {item.kind === "curated" && (item.warningSigns.length > 0 || item.protectionSteps.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {item.warningSigns.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-warning">
                <ShieldAlert className="h-3.5 w-3.5" />
                Warning Signs
              </h2>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {item.warningSigns.map((sign, i) => (
                  <li key={i} className="text-sm text-ink-muted">
                    • {sign}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.protectionSteps.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-secondary">
                <ShieldCheck className="h-3.5 w-3.5" />
                How to Protect Yourself
              </h2>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {item.protectionSteps.map((step, i) => (
                  <li key={i} className="text-sm text-ink-muted">
                    • {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {aiExplanation && (
        <ExpandableSection title="AI Explanation" icon={Sparkles}>
          <p className="mb-3 text-xs text-ink-faint">
            A beginner-friendly interpretation of the verified information above — not itself a verified source.
          </p>
          <AiExplanationCard explanation={aiExplanation} />
        </ExpandableSection>
      )}

      <ExpandableSection title="Timeline" icon={ShieldCheck} defaultOpen={false}>
        <ThreatTimeline
          publishedDate={item.kind === "curated" ? item.publishedDate : item.publishedDate}
          lastUpdatedDate={item.kind === "curated" ? item.lastUpdatedDate : item.lastModifiedDate}
        />
      </ExpandableSection>

      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">What You Can Do</h2>
        <div className="mt-3">
          <ThreatRecommendation
            recommendations={recommendations}
            relatedLessonId={item.kind === "curated" ? item.relatedLessonId : undefined}
          />
        </div>
      </div>
    </div>
  );
}
