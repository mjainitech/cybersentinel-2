import { useEffect, useState } from "react";
import { ShieldCheck, GraduationCap, Radar, Award, Info, Mail } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/useToast";
import { getNotificationPreferences, updateNotificationPreferences } from "@/services/actionCenterService";
import type { NotificationPreferences as NotificationPreferencesType } from "@/services/actionCenterService";

const TOGGLES: {
  key: keyof Omit<NotificationPreferencesType, "emailEnabled">;
  label: string;
  description: string;
  icon: typeof ShieldCheck;
}[] = [
  { key: "security", label: "Security Alerts", description: "Score changes and Security Center updates.", icon: ShieldCheck },
  { key: "learning", label: "Learning Notifications", description: "Lesson and progress updates.", icon: GraduationCap },
  { key: "threatIntelligence", label: "Threat Intelligence Updates", description: "Relevant threat activity.", icon: Radar },
  { key: "achievement", label: "Achievement Notifications", description: "Learning Hub achievements you unlock.", icon: Award },
  { key: "system", label: "System Notifications", description: "Report generation and other system events.", icon: Info },
];

/**
 * These toggles only control the separate notification feed — they
 * never hide anything from the Security Center or Action Center
 * itself. A genuinely critical finding always remains visible there
 * regardless of what's toggled off here.
 */
export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => showToast("Couldn't load notification preferences.", "error"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (key: keyof NotificationPreferencesType) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await updateNotificationPreferences({ [key]: next[key] });
    } catch {
      setPrefs(prefs);
      showToast("Something went wrong saving that preference.", "error");
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading notification preferences..." className="py-8" />;
  if (!prefs) return null;

  return (
    <div className="flex flex-col gap-3">
      {TOGGLES.map((toggle) => (
        <div
          key={toggle.key}
          className="flex items-center justify-between gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-3.5"
        >
          <div className="flex items-center gap-3">
            <toggle.icon className="h-4 w-4 shrink-0 text-accent-primary" />
            <div>
              <p className="text-sm text-ink">{toggle.label}</p>
              <p className="text-xs text-ink-faint">{toggle.description}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={prefs[toggle.key]}
            aria-label={toggle.label}
            onClick={() => handleToggle(toggle.key)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              prefs[toggle.key] ? "bg-accent-primary" : "bg-base-elevated"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                prefs[toggle.key] ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-base-border bg-base-elevated/10 p-3.5 opacity-70">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
          <div>
            <p className="text-sm text-ink-muted">Email Notifications</p>
            <p className="text-xs text-ink-faint">Not available yet — CyberSentinel doesn't send email notifications today.</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={false}
          aria-label="Email Notifications (unavailable)"
          disabled
          className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-base-elevated"
        >
          <span className="absolute top-0.5 h-5 w-5 translate-x-0.5 rounded-full bg-white/60" />
        </button>
      </div>
    </div>
  );
}
