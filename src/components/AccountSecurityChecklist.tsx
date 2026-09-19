import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { PasswordChecklistState } from "@/services/passwordHistoryService";
import { cn } from "@/utils/cn";

const STORAGE_KEY = "cybersentinel-security-checklist";

const CHECKLIST_ITEMS: { key: keyof PasswordChecklistState; label: string }[] = [
  { key: "uniquePasswords", label: "I use a unique password for each important account" },
  { key: "usesMfa", label: "I have multi-factor authentication enabled where it's offered" },
  { key: "usesPasswordManager", label: "I use a password manager" },
  { key: "avoidsReuse", label: "I avoid reusing old passwords" },
  { key: "checksForBreaches", label: "I periodically check whether my accounts appear in a data breach" },
];

const DEFAULT_STATE: PasswordChecklistState = {
  uniquePasswords: false,
  usesMfa: false,
  usesPasswordManager: false,
  avoidsReuse: false,
  checksForBreaches: false,
};

function loadState(): PasswordChecklistState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_STATE;
  }
}

interface AccountSecurityChecklistProps {
  onChange?: (state: PasswordChecklistState, completionPercent: number) => void;
}

/**
 * Tracks general account-security habits over time — entirely
 * separate from the password analyzer above. Persisted to
 * localStorage since none of this is sensitive (just booleans about
 * habits, never any password text), so it's safe to remember between visits.
 */
export function AccountSecurityChecklist({ onChange }: AccountSecurityChecklistProps) {
  const [state, setState] = useState<PasswordChecklistState>(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const completed = Object.values(state).filter(Boolean).length;
    const percent = Math.round((completed / CHECKLIST_ITEMS.length) * 100);
    onChange?.(state, percent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const completedCount = Object.values(state).filter(Boolean).length;
  const percent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const toggle = (key: keyof PasswordChecklistState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between text-xs text-ink-faint">
          <span>Completion</span>
          <span className="font-mono text-ink">{percent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-base-elevated">
          <div
            className="h-full rounded-full bg-cta-gradient transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = state[item.key];
          return (
            <li key={item.key}>
              <button
                onClick={() => toggle(item.key)}
                aria-pressed={checked}
                className="flex w-full items-center gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3 text-left transition-colors hover:bg-base-elevated/60"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked ? "border-accent-secondary bg-accent-secondary/20 text-accent-secondary" : "border-base-border"
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={cn("text-sm", checked ? "text-ink-muted line-through" : "text-ink")}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
