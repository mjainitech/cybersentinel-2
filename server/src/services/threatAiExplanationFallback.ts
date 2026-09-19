import type { AiExplanation, ThreatSeverity } from "../types";

const SEVERITY_FRAMING: Record<ThreatSeverity, string> = {
  low: "This is generally lower-risk, but still worth being aware of.",
  medium: "This is a moderate risk worth taking seriously.",
  high: "This is a serious risk that's worth acting on.",
  critical: "This is a critical, high-priority risk.",
};

export function buildFallbackThreatExplanation(title: string, description: string, severity: ThreatSeverity | "unknown"): AiExplanation {
  const framing = severity === "unknown" ? "This threat's severity hasn't been formally rated." : SEVERITY_FRAMING[severity];

  return {
    verdict: `${title}: ${framing}`,
    reasons: [description],
    risks: ["Review the full description and protection steps below for specifics."],
    nextSteps: [
      "Review the protection steps listed for this threat.",
      "Check whether related CyberSentinel tools or lessons apply to you.",
    ],
    generatedByAi: false,
  };
}
