import { useEffect, useState } from "react";
import type { PrivacyRating } from "@/services/resumeScanService";
import { PRIVACY_RATING_LABELS } from "@/services/resumeScanService";

interface PrivacyScoreGaugeProps {
  score: number;
  rating: PrivacyRating;
}

const ratingConfig: Record<PrivacyRating, { color: string }> = {
  excellent: { color: "#22D3B8" },
  good: { color: "#4F7CFF" },
  "needs-improvement": { color: "#F5A623" },
  "high-risk": { color: "#EF5A5A" },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * 0–100 privacy score rendered as an animated ring. Deliberately a
 * separate component from RiskScoreGauge (Website Scanner) rather
 * than a shared one — the two use different rating scales
 * (safe/warning/danger vs. excellent/good/needs-improvement/high-risk)
 * and sharing one component would mean threading an awkward mapping
 * between them just to reuse a ring.
 */
export function PrivacyScoreGauge({ score, rating }: PrivacyScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { color } = ratingConfig[rating];

  useEffect(() => {
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
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
            style={{ stroke: color, strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold text-ink">{animatedScore}</span>
          <span className="text-[11px] uppercase tracking-widest text-ink-faint">/ 100</span>
        </div>
      </div>

      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color, backgroundColor: `${color}1A` }}>
        {PRIVACY_RATING_LABELS[rating]}
      </span>
    </div>
  );
}
