import { useEffect, useState } from "react";
import type { CheckStatus } from "@/services/scanService";
import { cn } from "@/utils/cn";

interface RiskScoreGaugeProps {
  score: number;
  band: Exclude<CheckStatus, "unknown">;
}

const bandConfig: Record<Exclude<CheckStatus, "unknown">, { label: string; color: string; ring: string }> = {
  safe: { label: "Safe", color: "#22D3B8", ring: "stroke-accent-secondary" },
  warning: { label: "Use Caution", color: "#F5A623", ring: "stroke-accent-warning" },
  danger: { label: "Dangerous", color: "#EF5A5A", ring: "stroke-accent-danger" },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * 0–100 risk score rendered as an animated ring, color-coded by band:
 * Safe (green) / Use Caution (yellow) / Dangerous (red).
 */
export function RiskScoreGauge({ score, band }: RiskScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { label, color, ring } = bandConfig[band];

  useEffect(() => {
    // Animate the ring drawing in and the number counting up on mount.
    const frame = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#232B3D" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={cn(ring, "transition-[stroke-dashoffset] duration-1000 ease-out")}
            style={{ stroke: color, strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold text-ink">{animatedScore}</span>
          <span className="text-[11px] uppercase tracking-widest text-ink-faint">/ 100</span>
        </div>
      </div>

      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ color, backgroundColor: `${color}1A` }}
      >
        {label}
      </span>
    </div>
  );
}
