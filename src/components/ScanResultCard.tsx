import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CheckStatus } from "@/services/scanService";
import { useDisclosure } from "@/hooks/useDisclosure";
import { Tooltip } from "@/components/Tooltip";
import { getFlagEmoji } from "@/utils/countryFlag";
import { cn } from "@/utils/cn";

interface ScanResultCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  summary: string;
  learnMore: string;
  glossary: string;
  status: CheckStatus;
  meta?: Record<string, string>;
  /** Stagger index used to delay this card's entrance animation — purely cosmetic. */
  index?: number;
}

const statusConfig: Record<
  CheckStatus,
  { label: string; badgeIcon: LucideIcon; classes: string; ring: string; border: string }
> = {
  safe: {
    label: "Safe",
    badgeIcon: CheckCircle2,
    classes: "text-accent-secondary bg-accent-secondary/10",
    ring: "ring-accent-secondary/25",
    border: "before:bg-accent-secondary",
  },
  warning: {
    label: "Use Caution",
    badgeIcon: AlertTriangle,
    classes: "text-accent-warning bg-accent-warning/10",
    ring: "ring-accent-warning/25",
    border: "before:bg-accent-warning",
  },
  danger: {
    label: "Dangerous",
    badgeIcon: XCircle,
    classes: "text-accent-danger bg-accent-danger/10",
    ring: "ring-accent-danger/25",
    border: "before:bg-accent-danger",
  },
  unknown: {
    label: "Unavailable",
    badgeIcon: HelpCircle,
    classes: "text-ink-faint bg-base-elevated",
    ring: "ring-base-border",
    border: "before:bg-base-border",
  },
};

/**
 * A single check inside the Security Report. Shows the detected value
 * and a one-line summary up front; "Learn More" expands a generic
 * explanation, while the (i) icon next to the title gives a one-line
 * glossary definition on hover for a quicker glance. A colored left
 * edge (the `before:` pseudo-element) reinforces the status at a
 * glance even before reading the badge.
 */
export function ScanResultCard({
  icon: Icon,
  title,
  value,
  summary,
  learnMore,
  glossary,
  status,
  meta,
  index = 0,
}: ScanResultCardProps) {
  const { isOpen, toggle } = useDisclosure();
  const { label, badgeIcon: BadgeIcon, classes, ring, border } = statusConfig[status];
  const flag = getFlagEmoji(meta?.countryCode);

  return (
    <div
      className={cn(
        "surface-card relative animate-fade-up p-5 pl-6 opacity-0",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-glow",
        "before:absolute before:bottom-5 before:left-0 before:top-5 before:w-1 before:rounded-full before:content-['']",
        border
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", classes, ring)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </div>

        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", classes)}>
          <BadgeIcon className="h-3.5 w-3.5" />
          {label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
        <Tooltip content={glossary}>
          <button
            type="button"
            aria-label={`What is ${title}?`}
            className="text-ink-faint transition-colors hover:text-accent-primary"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>

      <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-ink-faint">
        {flag && <span aria-hidden="true">{flag}</span>}
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{summary}</p>

      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-accent-primary transition-colors hover:text-accent-secondary"
      >
        Learn More
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300",
          isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="rounded-lg border border-base-border bg-base-elevated/50 p-3 text-xs leading-relaxed text-ink-muted">
            {learnMore}
          </p>
        </div>
      </div>
    </div>
  );
}
