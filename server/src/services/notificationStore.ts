import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { AppNotification, NotificationCategory } from "../types";
import { getPreferences } from "./notificationPreferencesStore";

const store = new JsonFileStore<AppNotification[]>(path.join(__dirname, "..", "..", "data", "notifications.json"), []);

/** Caps how many notifications we keep per user — this is a notification feed, not a permanent audit log. */
const MAX_PER_USER = 100;

export interface CreateNotificationInput {
  category: NotificationCategory;
  title: string;
  description: string;
  relatedPage?: string;
}

/**
 * Only ever called from real event side-effects elsewhere in the
 * backend (a lesson completed, a score snapshot showing real
 * improvement, a report actually generated) — never speculatively or
 * on a timer, since this app has no background job scheduler and the
 * spec says not to introduce one just for this. Respects the user's
 * notification preferences: a disabled category is silently skipped,
 * per "Allow users to disable non-critical notifications" — except
 * this function is never used for genuinely critical Security Center
 * findings, which always remain visible in the Action Center itself
 * regardless of notification preferences.
 */
export async function createNotification(userId: string, input: CreateNotificationInput): Promise<AppNotification | null> {
  const prefs = await getPreferences(userId);
  const categoryEnabled: Record<NotificationCategory, boolean> = {
    security: prefs.security,
    learning: prefs.learning,
    "threat-intelligence": prefs.threatIntelligence,
    achievement: prefs.achievement,
    system: prefs.system,
  };
  if (!categoryEnabled[input.category]) return null;

  const notification: AppNotification = {
    id: crypto.randomUUID(),
    userId,
    category: input.category,
    title: input.title,
    description: input.description,
    createdAt: new Date().toISOString(),
    read: false,
    relatedPage: input.relatedPage,
  };

  const all = await store.read();
  const usersOther = all.filter((n) => n.userId !== userId);
  const usersOwn = all
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const trimmed = [notification, ...usersOwn].slice(0, MAX_PER_USER);
  await store.write([...usersOther, ...trimmed]);

  return notification;
}

export async function listNotificationsForUser(userId: string, limit = 30): Promise<AppNotification[]> {
  const all = await store.read();
  return all
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function countUnreadForUser(userId: string): Promise<number> {
  const all = await store.read();
  return all.filter((n) => n.userId === userId && !n.read).length;
}

export async function markAsRead(userId: string, notificationId: string): Promise<boolean> {
  const all = await store.read();
  const index = all.findIndex((n) => n.id === notificationId && n.userId === userId);
  if (index === -1) return false;

  all[index] = { ...all[index], read: true };
  await store.write(all);
  return true;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const all = await store.read();
  const updated = all.map((n) => (n.userId === userId ? { ...n, read: true } : n));
  await store.write(updated);
}

export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  const all = await store.read();
  const index = all.findIndex((n) => n.id === notificationId && n.userId === userId);
  if (index === -1) return false;

  all.splice(index, 1);
  await store.write(all);
  return true;
}
