import { useLocation } from "react-router-dom";
import { Bot } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AIChat } from "@/components/AIChat";
import type { ExplainRequest } from "@/services/aiCoachService";

interface CoachNavigationState {
  explain?: ExplainRequest;
  prompt?: string;
}

export function AISecurityCoachPage() {
  const location = useLocation();
  const state = (location.state as CoachNavigationState | null) ?? null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <Bot className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">AI Security Coach</h1>
            <p className="text-sm text-ink-muted">Understand your security results and learn what to do next.</p>
          </div>
        </div>

        <div className="mt-6">
          <AIChat initialExplain={state?.explain} initialPrompt={state?.prompt} />
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-faint">
          The AI Security Coach is an educational assistant. It does not replace a professional cybersecurity consultation
          and never guarantees that any account or device is secure.
        </p>
      </div>
    </DashboardLayout>
  );
}
