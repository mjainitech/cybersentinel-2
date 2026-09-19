import { authHeader } from "@/services/authToken";

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus = "not-started" | "in-progress" | "completed" | "dismissed";

export type ActionSourceSystem =
  | "website-scanner"
  | "email-analyzer"
  | "resume-scanner"
  | "password-center"
  | "breach-checker"
  | "security-center"
  | "learning-hub"
  | "threat-intelligence"
  | "security-analytics";

export interface SecurityAction {
  actionKey: string;
  title: string;
  description: string;
  reason: string;
  priority: ActionPriority;
  sources: ActionSourceSystem[];
  recommendedToolHref?: string;
  recommendedToolLabel?: string;
  relatedLessonId?: string;
  relatedLessonTitle?: string;
  relatedThreatId?: string;
  estimatedEffortMinutes: number;
  status: ActionStatus;
  createdAt: string;
}

export interface ActionCenterOverview {
  critical: number;
  high: number;
  recommended: number;
  completed: number;
}

export interface ActionCenterResponse {
  overview: ActionCenterOverview;
  actions: SecurityAction[];
  isNewUser: boolean;
  partial: boolean;
  partialMessage?: string;
}

export type NotificationCategory = "security" | "learning" | "threat-intelligence" | "achievement" | "system";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  relatedPage?: string;
}

export interface NotificationPreferences {
  security: boolean;
  learning: boolean;
  threatIntelligence: boolean;
  achievement: boolean;
  system: boolean;
  emailEnabled: boolean;
}

export const SOURCE_LABELS: Record<ActionSourceSystem, string> = {
  "website-scanner": "Website Scanner",
  "email-analyzer": "Email Phishing Analyzer",
  "resume-scanner": "Resume Privacy Scanner",
  "password-center": "Password Security Center",
  "breach-checker": "Data Breach Checker",
  "security-center": "Security Center",
  "learning-hub": "Learning Hub",
  "threat-intelligence": "Threat Intelligence",
  "security-analytics": "Security Analytics",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function getActionCenter(): Promise<ActionCenterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/action-center`, { headers: { ...authHeader() } });
  return handle(response);
}

export async function updateActionStatus(actionKey: string, status: ActionStatus): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/action-center/actions/${encodeURIComponent(actionKey)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ status }),
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong saving that.");
  }
}

export async function listNotifications(limit = 30): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/action-center/notifications?limit=${limit}`, { headers: { ...authHeader() } });
  return handle(response);
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/action-center/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: { ...authHeader() },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/action-center/notifications/read-all`, { method: "PATCH", headers: { ...authHeader() } });
}

export async function deleteNotification(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/action-center/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/action-center/notification-preferences`, { headers: { ...authHeader() } });
  const { preferences } = await handle<{ preferences: NotificationPreferences }>(response);
  return preferences;
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/action-center/notification-preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(prefs),
  });
  const { preferences } = await handle<{ preferences: NotificationPreferences }>(response);
  return preferences;
}
