import { Link } from "react-router-dom";
import { ShieldCheck, GraduationCap, Radar, Award, Info, X } from "lucide-react";
import type { AppNotification, NotificationCategory } from "@/services/actionCenterService";

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_ICON: Record<NotificationCategory, typeof ShieldCheck> = {
  security: ShieldCheck,
  learning: GraduationCap,
  "threat-intelligence": Radar,
  achievement: Award,
  system: Info,
};

export function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const Icon = CATEGORY_ICON[notification.category];

  const content = (
    <div className="flex items-start gap-3 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className={`text-sm ${notification.read ? "text-ink-muted" : "font-medium text-ink"}`}>{notification.title}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{notification.description}</p>
        <p className="mt-1 text-[11px] text-ink-faint">{new Date(notification.createdAt).toLocaleString()}</p>
      </div>
      {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-primary" aria-label="Unread" />}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
        className="shrink-0 rounded-full p-1 text-ink-faint hover:bg-base-elevated hover:text-accent-danger"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (notification.relatedPage) {
    return (
      <Link to={notification.relatedPage} onClick={() => onRead(notification.id)} className="block hover:bg-base-elevated/40">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={() => onRead(notification.id)} className="block w-full text-left hover:bg-base-elevated/40">
      {content}
    </button>
  );
}
