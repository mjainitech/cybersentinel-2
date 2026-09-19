import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getActionCenter,
  updateActionStatus,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/actionCenterController";

export const actionCenterRouter = Router();

// Every endpoint requires auth and is scoped to req.userId — never a
// client-supplied id, per the spec's explicit authorization requirement.
actionCenterRouter.use(requireAuth);

actionCenterRouter.get("/", getActionCenter);
actionCenterRouter.patch("/actions/:actionKey/status", updateActionStatus);

// Literal "read-all" path registered before the ":id" wildcard, so it
// never gets swallowed as an id — same pattern used throughout this project.
actionCenterRouter.get("/notifications", listNotifications);
actionCenterRouter.patch("/notifications/read-all", markAllNotificationsRead);
actionCenterRouter.patch("/notifications/:id/read", markNotificationRead);
actionCenterRouter.delete("/notifications/:id", removeNotification);

actionCenterRouter.get("/notification-preferences", getNotificationPreferences);
actionCenterRouter.put("/notification-preferences", updateNotificationPreferences);
