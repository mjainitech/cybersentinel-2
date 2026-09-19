import { describe, it, expect, afterEach } from "vitest";
import {
  createNotification,
  listNotificationsForUser,
  countUnreadForUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../notificationStore";
import { setPreferences } from "../notificationPreferencesStore";

const USER_A = "test-user-notif-a";
const USER_B = "test-user-notif-b";

async function cleanup(userId: string) {
  const notifications = await listNotificationsForUser(userId, 100);
  for (const n of notifications) {
    await deleteNotification(userId, n.id);
  }
  await setPreferences(userId, { security: true, learning: true, threatIntelligence: true, achievement: true, system: true });
}

describe("notificationStore", () => {
  afterEach(async () => {
    await cleanup(USER_A);
    await cleanup(USER_B);
  });

  it("creates a notification retrievable for that user", async () => {
    await createNotification(USER_A, { category: "achievement", title: "Test", description: "test desc" });
    const notifications = await listNotificationsForUser(USER_A);
    expect(notifications.some((n) => n.title === "Test")).toBe(true);
  });

  it("new notifications default to unread", async () => {
    const created = await createNotification(USER_A, { category: "security", title: "Unread Test", description: "test" });
    expect(created?.read).toBe(false);
  });

  it("does not let one user see another user's notifications (authorization scoping)", async () => {
    await createNotification(USER_A, { category: "system", title: "Private", description: "test" });
    const userBNotifications = await listNotificationsForUser(USER_B);
    expect(userBNotifications.some((n) => n.title === "Private")).toBe(false);
  });

  it("marking a notification read updates its state and the unread count", async () => {
    const created = await createNotification(USER_A, { category: "learning", title: "Read Test", description: "test" });
    const before = await countUnreadForUser(USER_A);
    await markAsRead(USER_A, created!.id);
    const after = await countUnreadForUser(USER_A);
    expect(after).toBe(before - 1);
  });

  it("marking all as read clears every unread notification for that user only", async () => {
    await createNotification(USER_A, { category: "security", title: "A1", description: "test" });
    await createNotification(USER_A, { category: "security", title: "A2", description: "test" });
    await createNotification(USER_B, { category: "security", title: "B1", description: "test" });

    await markAllAsRead(USER_A);

    expect(await countUnreadForUser(USER_A)).toBe(0);
    expect(await countUnreadForUser(USER_B)).toBeGreaterThan(0);
  });

  it("deleting a notification removes it without affecting others", async () => {
    const created = await createNotification(USER_A, { category: "system", title: "To Delete", description: "test" });
    const removed = await deleteNotification(USER_A, created!.id);
    expect(removed).toBe(true);
    const notifications = await listNotificationsForUser(USER_A);
    expect(notifications.some((n) => n.id === created!.id)).toBe(false);
  });

  it("respects notification preferences — a disabled category produces no notification", async () => {
    await setPreferences(USER_A, { learning: false });
    const result = await createNotification(USER_A, { category: "learning", title: "Should Not Appear", description: "test" });
    expect(result).toBeNull();

    const notifications = await listNotificationsForUser(USER_A);
    expect(notifications.some((n) => n.title === "Should Not Appear")).toBe(false);
  });

  it("a disabled category does not affect other enabled categories", async () => {
    await setPreferences(USER_A, { learning: false });
    const result = await createNotification(USER_A, { category: "security", title: "Should Appear", description: "test" });
    expect(result).not.toBeNull();
  });
});
