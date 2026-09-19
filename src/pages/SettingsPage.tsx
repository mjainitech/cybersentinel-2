import { Settings as SettingsIcon, Bell } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card } from "@/components/Card";
import { NotificationPreferences } from "@/components/NotificationPreferences";

/**
 * Settings was previously a full placeholder. This adds the one
 * piece the spec explicitly required — notification preferences —
 * rather than building out unrelated account-settings functionality
 * that wasn't asked for.
 */
export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <SettingsIcon className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
            <p className="text-sm text-ink-muted">Manage your account and preferences.</p>
          </div>
        </div>

        <Card className="mt-8 p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent-primary" />
            <h2 className="font-display text-sm font-semibold text-ink">Notification Preferences</h2>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Control which notifications appear in your notification feed. This never hides genuinely critical findings from
            your Security Center or Action Center — it only controls the separate notification feed.
          </p>
          <div className="mt-4">
            <NotificationPreferences />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
