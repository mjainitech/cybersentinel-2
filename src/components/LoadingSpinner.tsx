import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

/**
 * Standalone spinner for places a full page/section is loading
 * (as opposed to Button's built-in isLoading state for inline use).
 */
export function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 text-ink-muted", className)}>
      <Loader2 className={cn(sizeMap[size], "animate-spin text-accent-primary")} aria-hidden="true" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
