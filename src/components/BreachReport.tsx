import { Link } from "react-router-dom";
import { ShieldAlert, KeySquare, Mail, ArrowRight } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AiExplanationCard } from "@/components/AiExplanationCard";
import { ExposureScore } from "@/components/ExposureScore";
import { BreachCard } from "@/components/BreachCard";
import { ExposureCategoryGrid } from "@/components/ExposureCategory";
import { SecurityActionList } from "@/components/SecurityActionList";
import { BreachTimeline } from "@/components/BreachTimeline";
import { ExpandableSection } from "@/components/ExpandableSection";
import type { BreachCheckReport } from "@/services/breachService";

interface BreachReportProps {
  report: BreachCheckReport;
  /** Present only once the report has been saved — enables persisting action-plan checkbox state. */
  savedId?: string;
}

/**
 * The full breach report, from the top-line verdict down through
 * every required section. Deliberately does not say "this account is
 * safe" anywhere, even when breachFound is false — see the summary
 * copy below.
 */
export function BreachReport({ report, savedId }: BreachReportProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card glass className="flex flex-col items-center gap-8 p-6 sm:flex-row sm:items-start sm:p-8">
        <ExposureScore score={report.riskScore.score} level={report.riskScore.level} factors={report.riskScore.factors} />

        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            {report.breachFound ? `Found in ${report.breaches.length} known breach${report.breaches.length === 1 ? "" : "es"}` : "No known breaches found"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {report.breachFound
              ? "Details on what was exposed are below — no leaked passwords or stolen data are ever shown here."
              : "This does not guarantee this account has never been exposed. It only means no matching records were found in the database checked."}
          </p>
        </div>
      </Card>

      <AiExplanationCard explanation={report.aiExplanation} />

      {report.passwordsPotentiallyExposed && (
        <Card className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-danger/10 text-accent-danger">
              <KeySquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Review your password security</p>
              <p className="text-xs text-ink-muted">A breach here reported passwords as exposed — worth a closer look.</p>
            </div>
          </div>
          <Link to="/dashboard/password-center">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open Password Security Center
            </Button>
          </Link>
        </Card>
      )}

      {report.breachFound && (
        <Card className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Watch for targeted phishing</p>
              <p className="text-xs text-ink-muted">
                Breached email addresses can sometimes receive more targeted phishing afterward — though not every suspicious email is necessarily related to this.
              </p>
            </div>
          </div>
          <Link to="/dashboard/email-scanner">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open Email Phishing Analyzer
            </Button>
          </Link>
        </Card>
      )}

      <ExpandableSection title="Exposure Categories" icon={ShieldAlert}>
        <ExposureCategoryGrid categoriesFound={report.categoriesFound} categoriesNotFound={report.categoriesNotFound} />
      </ExpandableSection>

      {report.breaches.length > 0 && (
        <>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Breach Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {report.breaches.map((breach) => (
                <BreachCard key={breach.name} breach={breach} />
              ))}
            </div>
          </div>

          <ExpandableSection title="Breach Timeline" icon={ShieldAlert} defaultOpen={false}>
            <BreachTimeline breaches={report.breaches} />
          </ExpandableSection>
        </>
      )}

      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">Action Plan</h2>
        <div className="mt-4">
          <SecurityActionList actions={report.actionPlan} reportId={savedId} />
        </div>
      </div>
    </div>
  );
}
