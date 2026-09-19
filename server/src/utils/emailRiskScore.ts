import type { EmailIndicator, EmailRiskClassification } from "../types";

/** Points deducted per indicator, by severity. Multiple indicators of the same category still each count — unlike the resume scanner, repeated urgent phrases genuinely do compound the read on an email. */
const SEVERITY_PENALTY: Record<EmailIndicator["severity"], number> = {
  low: 3,
  medium: 8,
  high: 18,
};

const MAX_PENALTY = 100;

export function calculateEmailRiskScore(indicators: EmailIndicator[]): number {
  const totalPenalty = indicators.reduce((sum, indicator) => sum + SEVERITY_PENALTY[indicator.severity], 0);
  return Math.max(0, 100 - Math.min(totalPenalty, MAX_PENALTY));
}

export function getEmailClassification(score: number): EmailRiskClassification {
  if (score >= 85) return "likely-safe";
  if (score >= 65) return "use-caution";
  if (score >= 35) return "suspicious";
  return "likely-phishing";
}

export const EMAIL_CLASSIFICATION_LABELS: Record<EmailRiskClassification, string> = {
  "likely-safe": "Likely Safe",
  "use-caution": "Use Caution",
  suspicious: "Suspicious",
  "likely-phishing": "Likely Phishing",
};
