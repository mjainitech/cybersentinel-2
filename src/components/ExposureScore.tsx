import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ExposureRiskLevel } from "@/services/breachService";
import { cn } from "@/utils/cn";

interface ExposureScoreProps {
  score: number;
  level: ExposureRiskLevel;
  factors: string[];
}

const LEVEL_CONFIG: Record<ExposureRiskLevel, { label: string; color: string }> = {
  low: { label: "Low Risk", color: "#22D3B8" },
  moderate: { label: "Moderate Risk", color: "#4F7CFF" },
  high: { label: "High Risk", color: "#F5A623" },
  severe: { label: "Severe Risk", color: "#EF5A5A" },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The Account Exposure Risk Score. Deliberately not presented as a
 * precise probability — see the expandable "How is this score
 * calculated?" section, which lists the exact factors that produced
 * this number, sourced directly from the backend's own scoring logic.
 */
export function ExposureScore({ score, level, factors }: ExposureScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showMethodology, setShowMethodology] = useState(false);
  const { label, color } = LEVEL_CONFIG[level];

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
        {label}
      </span>

      <button
        onClick={() => setShowMethodology((prev) => !prev)}
        aria-expanded={showMethodology}
        className="flex items-center gap-1 text-xs font-medium text-accent-primary transition-colors hover:text-accent-secondary"
      >
        How is this score calculated?
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showMethodology && "rotate-180")} />
      </button>

      <div
        className={cn(
          "grid w-full overflow-hidden transition-all duration-300",
          showMethodology ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-lg border border-base-border bg-base-elevated/40 p-3 text-left">
            <p className="text-xs text-ink-faint">
              This is a transparent, relative indicator meant to guide action — not a scientifically exact probability.
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {factors.map((factor, index) => (
                <li key={index} className="text-xs text-ink-muted">
                  • {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
