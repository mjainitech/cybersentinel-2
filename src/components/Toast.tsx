import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ToastType } from "@/hooks/useToast";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<ToastType, { icon: typeof Info; classes: string }> = {
  error: {
    icon: AlertTriangle,
    classes: "border-accent-danger/30 bg-accent-danger/10 text-accent-danger",
  },
  success: {
    icon: CheckCircle2,
    classes: "border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary",
  },
  info: {
    icon: Info,
    classes: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
  },
};

/**
 * A single toast. Rendered by ToastContainer inside ToastProvider —
 * pages never mount this directly, they call useToast().showToast(...).
 */
export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const { icon: Icon, classes } = typeConfig[type];

  return (
    <div
      role="alert"
      className={cn(
        "surface-card flex w-full max-w-sm items-start gap-3 border p-4 shadow-soft animate-fade-up",
        classes
      )}
    >
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed text-ink">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="text-ink-faint transition-colors hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
