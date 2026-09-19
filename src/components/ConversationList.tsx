import { ShieldCheck, TrendingUp, Lightbulb, KeySquare, Mail, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  prompt: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Review My Security", prompt: "Can you review my overall security profile?", icon: ShieldCheck },
  { label: "Explain My Score", prompt: "Why is my security score what it is?", icon: TrendingUp },
  { label: "What Should I Do Next?", prompt: "What should I improve first?", icon: Lightbulb },
  { label: "Improve My Password Security", prompt: "How can I improve my password security?", icon: KeySquare },
  { label: "Learn About Phishing", prompt: "What is phishing and how can I recognize it?", icon: Mail },
  { label: "Review My Breach Results", prompt: "What does my breach check result mean?", icon: ShieldAlert },
];

interface ConversationListProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * This is the "Quick Actions" list from the spec, not a history of
 * past conversations — the AI Coach deliberately doesn't persist
 * conversation content server-side (see the backend's
 * securityContextService.ts and aiCoachController.ts comments), so
 * there's no saved conversation list to show. Named ConversationList
 * to match the spec's requested reusable component.
 */
export function ConversationList({ onSelect, disabled }: ConversationListProps) {
  return (
    <div className="flex flex-col gap-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="flex items-center gap-2.5 rounded-xl border border-base-border bg-base-elevated/30 px-3.5 py-2.5 text-left text-sm text-ink-muted transition-colors hover:border-accent-primary/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <action.icon className="h-4 w-4 shrink-0 text-accent-primary" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
