import type { PasswordRating } from "@/utils/passwordAnalysis";

interface PasswordStrengthMeterProps {
  score: number;
  rating: PasswordRating;
  resistanceDescription: string;
}

const RATING_CONFIG: Record<PasswordRating, { label: string; color: string }> = {
  "very-weak": { label: "Very Weak", color: "#EF5A5A" },
  weak: { label: "Weak", color: "#F2795A" },
  fair: { label: "Fair", color: "#F5A623" },
  strong: { label: "Strong", color: "#4F7CFF" },
  excellent: { label: "Excellent", color: "#22D3B8" },
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Combines a circular score ring with a linear color-coded bar —
 * deliberately not animated with a mount-time ramp-up like the other
 * scanners' gauges (RiskScoreGauge, PrivacyScoreGauge), since this
 * one updates on every keystroke and a slow ease-in would fight with
 * itself on rapid typing. The CSS transition is short and immediate instead.
 */
export function PasswordStrengthMeter({ score, rating, resistanceDescription }: PasswordStrengthMeterProps) {
  const { label, color } = RATING_CONFIG[rating];
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 96 96" className="h-28 w-28 -rotate-90">
          <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#232B3D" strokeWidth="8" />
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            style={{ stroke: color, strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset, transition: "stroke-dashoffset 200ms ease-out, stroke 200ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-ink">{score}</span>
          <span className="text-[10px] uppercase tracking-widest text-ink-faint">/ 100</span>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200"
          style={{ color, backgroundColor: `${color}1A` }}
        >
          {label}
        </span>
        <p className="mt-2 text-sm text-ink-muted">{resistanceDescription}</p>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-base-elevated">
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
