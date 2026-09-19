import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/Card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Centered placeholder for any list/page with nothing to show yet — no scans, no search results, etc. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <Card className="max-w-md" glass>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
          <Icon className="h-5 w-5 text-accent-secondary" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </Card>
    </div>
  );
}
