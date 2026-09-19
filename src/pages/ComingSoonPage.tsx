import { Construction } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card } from "@/components/Card";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

/**
 * Placeholder for dashboard sub-routes (URL Scanner, Email Scanner, etc.)
 * whose real tools haven't been built yet. Keeps the sidebar fully
 * navigable today; swap each route's element for the real page later.
 */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Card className="max-w-md" glass>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Construction className="h-5 w-5 text-accent-secondary" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {description ?? "This tool is on the way. Check back soon."}
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
