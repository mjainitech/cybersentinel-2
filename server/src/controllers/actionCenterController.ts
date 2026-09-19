import type { Request, Response } from "express";
import { logger } from "../services/logger";
import { buildActionCenter } from "../services/actionAggregationService";
import { setActionStatus } from "../services/actionStatusStore";
import {
  listNotificationsForUser,
  countUnreadForUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationStore";
import { getPreferences, setPreferences } from "../services/notificationPreferencesStore";
import type { ActionStatus, NotificationPreferences } from "../types";

const VALID_STATUSES: ActionStatus[] = ["not-started", "in-progress", "completed", "dismissed"];

export async function getActionCenter(req: Request, res: Response) {
  try {
    const result = await buildActionCenter(req.userId!);
    return res.json(result);
  } catch (error) {
    logger.error("Failed to build Action Center", { error: String(error) });
    return res.status(500).json({ error: "Some actions are temporarily unavailable. Please try again." });
  }
}

export async function updateActionStatus(req: Request, res: Response) {
  const { actionKey } = req.params;
  const status = req.body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as ActionStatus)) {
    return res.status(400).json({ error: "Please provide a valid status." });
  }
  if (typeof actionKey !== "string" || !actionKey.trim()) {
    return res.status(400).json({ error: "Missing action." });
  }

  try {
    // Note: this only ever updates the STATUS record, keyed by userId
    // from the authenticated session — it never touches or deletes any
    // underlying scan/security finding the action was derived from.
    await setActionStatus(req.userId!, actionKey, status as ActionStatus);
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to update action status", { actionKey, error: String(error) });
    return res.status(500).json({ error: "Something went wrong saving that. Please try again." });
  }
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const [notifications, unreadCount] = await Promise.all([
      listNotificationsForUser(req.userId!, limit),
      countUnreadForUser(req.userId!),
    ]);
    return res.json({ notifications, unreadCount });
  } catch (error) {
    logger.error("Failed to list notifications", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading notifications." });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const found = await markAsRead(req.userId!, req.params.id);
    if (!found) return res.status(404).json({ error: "Notification not found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to mark notification read", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong." });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    await markAllAsRead(req.userId!);
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to mark all notifications read", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong." });
  }
}

export async function removeNotification(req: Request, res: Response) {
  try {
    const found = await deleteNotification(req.userId!, req.params.id);
    if (!found) return res.status(404).json({ error: "Notification not found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete notification", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong." });
  }
}

export async function getNotificationPreferences(req: Request, res: Response) {
  try {
    const prefs = await getPreferences(req.userId!);
    return res.json({ preferences: prefs });
  } catch (error) {
    logger.error("Failed to load notification preferences", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your preferences." });
  }
}

function sanitizePreferencesInput(body: unknown): Partial<NotificationPreferences> {
  if (!body || typeof body !== "object") return {};
  const allowedKeys: (keyof NotificationPreferences)[] = [
    "security",
    "learning",
    "threatIntelligence",
    "achievement",
    "system",
    "emailEnabled",
  ];
  const result: Partial<NotificationPreferences> = {};
  for (const key of allowedKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "boolean") result[key] = value;
  }
  return result;
}

export async function updateNotificationPreferences(req: Request, res: Response) {
  try {
    const updated = await setPreferences(req.userId!, sanitizePreferencesInput(req.body));
    return res.json({ preferences: updated });
  } catch (error) {
    logger.error("Failed to update notification preferences", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong saving your preferences." });
  }
}
