import path from "node:path";
import { JsonFileStore } from "./db";
import type { NotificationPreferences } from "../types";

interface PreferencesRecord extends NotificationPreferences {
  userId: string;
}

const store = new JsonFileStore<PreferencesRecord[]>(
  path.join(__dirname, "..", "..", "data", "notification-preferences.json"),
  []
);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  security: true,
  learning: true,
  threatIntelligence: true,
  achievement: true,
  system: true,
  emailEnabled: false,
};

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const records = await store.read();
  const record = records.find((r) => r.userId === userId);
  if (!record) return DEFAULT_PREFERENCES;

  const { userId: _userId, ...prefs } = record;
  return prefs;
}

/**
 * This mechanism only ever gates whether a notification-feed entry is
 * created (see notificationStore.ts) — it never hides anything from
 * the Action Center itself. A user who disables "security"
 * notifications still sees every real critical finding on
 * /action-center; they just won't get a separate feed entry about it.
 */
export async function setPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const records = await store.read();
  const current = await getPreferences(userId);
  const updated: NotificationPreferences = { ...current, ...preferences };

  const index = records.findIndex((r) => r.userId === userId);
  if (index >= 0) {
    records[index] = { userId, ...updated };
  } else {
    records.push({ userId, ...updated });
  }

  await store.write(records);
  return updated;
}
