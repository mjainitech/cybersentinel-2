import { Check, X } from "lucide-react";
import type { PasswordCheckItem } from "@/utils/passwordAnalysis";
import { cn } from "@/utils/cn";

interface PasswordChecklistProps {
  checks: PasswordCheckItem[];
}

/** Real-time pass/fail checklist for the password currently in the input — distinct from AccountSecurityChecklist, which tracks general habits over time. */
export function PasswordChecklist({ checks }: PasswordChecklistProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {checks.map((check) => (
        <li key={check.id} className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              check.passed ? "bg-accent-secondary/15 text-accent-secondary" : "bg-accent-danger/15 text-accent-danger"
            )}
          >
            {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          <span className={check.passed ? "text-ink-muted" : "text-ink-faint"}>{check.label}</span>
        </li>
      ))}
    </ul>
  );
}
