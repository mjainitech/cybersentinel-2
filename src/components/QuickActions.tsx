import { Link } from "react-router-dom";
import { Globe2, Mail, FileSearch, KeySquare, ShieldAlert, GraduationCap, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Run Website Scan", href: "/dashboard/url-scanner", icon: Globe2 },
  { label: "Analyze Email", href: "/dashboard/email-scanner", icon: Mail },
  { label: "Check Resume Privacy", href: "/dashboard/resume-scanner", icon: FileSearch },
  { label: "Review Password Security", href: "/dashboard/password-center", icon: KeySquare },
  { label: "Check Data Breach", href: "/dashboard/breach-checker", icon: ShieldAlert },
  { label: "Start Learning", href: "/dashboard/learning-hub", icon: GraduationCap },
  { label: "Ask AI", href: "/ai-security-coach", icon: Bot },
];

/** Every button here is an existing route — this never duplicates any tool's functionality. */
export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className="flex flex-col items-center gap-2 rounded-xl border border-base-border bg-base-elevated/30 p-3.5 text-center transition-colors hover:border-accent-primary/40 hover:bg-base-elevated/50"
        >
          <action.icon className="h-4 w-4 text-accent-primary" />
          <span className="text-xs text-ink-muted">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
