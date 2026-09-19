import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional trailing element — e.g. a "Coming Soon" button on the dashboard. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Card used for both the landing page feature grid and the dashboard's
 * tool grid. The icon tile reuses the brand gradient so every entry
 * point into the product feels like part of the same system.
 */
export function FeatureCard({ icon: Icon, title, description, action, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group surface-card relative overflow-hidden p-6",
        "transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-primary/40 hover:shadow-glow",
        className
      )}
    >
      {/* Ambient glow that appears on hover, echoing the scan-radar motif */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-primary/0 blur-2xl transition-colors duration-500 group-hover:bg-accent-primary/20" />

      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
        <Icon className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} aria-hidden="true" />
      </div>

      <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
