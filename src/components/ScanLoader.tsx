import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ScanLoaderProps {
  messages: string[];
  className?: string;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STEP_DURATION_MS = 900;

/**
 * Loading state for a scan: an animated progress ring (brand gradient
 * — this is progress, not a safety verdict, so it deliberately doesn't
 * use safe/warning/danger colors) paired with a step-by-step timeline.
 * Reusable across scanner pages — pass any message list and it drives
 * its own timing.
 */
export function ScanLoader({ messages, className }: ScanLoaderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, STEP_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [messages]);

  const percent = Math.round(((activeIndex + 1) / messages.length) * 100);
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className={cn("surface-card flex flex-col items-center gap-8 px-6 py-10 sm:flex-row sm:items-start sm:gap-10 sm:px-10", className)}>
      {/* Animated progress circle */}
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#232B3D" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            stroke="url(#scan-progress-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.6s ease-out",
            }}
          />
          <defs>
            <linearGradient id="scan-progress-gradient" x1="0" y1="0" x2="80" y2="80">
              <stop stopColor="#4F7CFF" />
              <stop offset="1" stopColor="#22D3B8" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute font-display text-lg font-semibold text-ink">{percent}%</span>
      </div>

      {/* Step timeline */}
      <ol className="flex w-full flex-col gap-5">
        {messages.map((message, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
          const isLast = index === messages.length - 1;

          return (
            <li key={message} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%+4px)] w-px transition-colors duration-500",
                    state === "done" ? "bg-accent-secondary/50" : "bg-base-border"
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  state === "done" && "border-accent-secondary bg-accent-secondary/15 text-accent-secondary",
                  state === "active" && "border-accent-primary bg-accent-primary/15 text-accent-primary",
                  state === "pending" && "border-base-border text-ink-faint"
                )}
              >
                {state === "done" && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {state === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {state === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>

              <span
                className={cn(
                  "pt-0.5 text-sm transition-colors duration-300",
                  state === "pending" ? "text-ink-faint" : "text-ink"
                )}
              >
                {message}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
