import { useEffect, useState } from "react";
import type { EmailRiskClassification } from "@/services/emailAnalysisService";
import { EMAIL_CLASSIFICATION_LABELS } from "@/services/emailAnalysisService";

interface EmailRiskMeterProps {
  score: number;
  classification: EmailRiskClassification;
}

const classificationColor: Record<EmailRiskClassification, string> = {
  "likely-safe": "#22D3B8",
  "use-caution": "#4F7CFF",
  suspicious: "#F5A623",
  "likely-phishing": "#EF5A5A",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Animated risk meter for the Email Phishing Analyzer. A sibling to
 * RiskScoreGauge (Website Scanner) and PrivacyScoreGauge (Resume
 * Scanner) rather than a shared component — each uses a different
 * rating scale, and sharing one component would mean threading an
 * awkward mapping between them just to reuse a ring shape.
 */
export function EmailRiskMeter({ score, classification }: EmailRiskMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = classificationColor[classification];

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
        {EMAIL_CLASSIFICATION_LABELS[classification]}
      </span>
    </div>
  );
}
