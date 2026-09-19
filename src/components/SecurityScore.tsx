import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SecurityGrade } from "@/services/securityCenterService";
import { cn } from "@/utils/cn";

interface SecurityScoreProps {
  score: number | null;
  grade: SecurityGrade | null;
  categoriesWithData: number;
  methodology: string[];
}

const GRADE_COLOR: Record<SecurityGrade, string> = {
  "A+": "#22D3B8",
  A: "#22D3B8",
  B: "#4F7CFF",
  C: "#F5A623",
  D: "#F5A623",
  F: "#EF5A5A",
};

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The CyberSentinel Security Profile's headline score. Deliberately
 * never renders a number when categoriesWithData is 0 — see the
 * page's empty state for that case instead of showing a misleading "0".
 */
export function SecurityScore({ score, grade, categoriesWithData, methodology }: SecurityScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showMethodology, setShowMethodology] = useState(false);
  const color = grade ? GRADE_COLOR[grade] : "#8891A5";

  useEffect(() => {
    if (score === null) return;
    const frame = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 144 144" className="h-36 w-36 -rotate-90">
          <circle cx="72" cy="72" r={RADIUS} fill="none" stroke="#232B3D" strokeWidth="10" />
          {score !== null && (
            <circle
              cx="72"
              cy="72"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-out"
              style={{
                stroke: color,
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE,
              }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score !== null ? (
            <>
              <span className="font-display text-4xl font-semibold text-ink">{animatedScore}</span>
              <span className="text-[11px] uppercase tracking-widest text-ink-faint">/ 100</span>
            </>
          ) : (
            <span className="text-2xl text-ink-faint">—</span>
          )}
        </div>
      </div>

      {grade && (
        <span className="rounded-full px-3.5 py-1 text-sm font-bold" style={{ color, backgroundColor: `${color}1A` }}>
          Grade: {grade}
        </span>
      )}

      <p className="max-w-xs text-center text-xs text-ink-faint">
        Your score is based on your CyberSentinel activity and security checks
        {categoriesWithData > 0 ? ` across ${categoriesWithData} of 6 categories.` : "."}
      </p>

      <button
        onClick={() => setShowMethodology((prev) => !prev)}
        aria-expanded={showMethodology}
        className="flex items-center gap-1 text-xs font-medium text-accent-primary transition-colors hover:text-accent-secondary"
      >
        How is this calculated?
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showMethodology && "rotate-180")} />
      </button>

      <div
        className={cn(
          "grid w-full max-w-sm overflow-hidden transition-all duration-300",
          showMethodology ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-lg border border-base-border bg-base-elevated/40 p-3 text-left">
            <ul className="flex flex-col gap-1.5">
              {methodology.map((line, index) => (
                <li key={index} className="text-xs leading-relaxed text-ink-muted">
                  • {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
