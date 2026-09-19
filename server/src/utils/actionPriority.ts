import type { ActionPriority, ThreatSeverity } from "../types";

/**
 * PRIORITIZATION LOGIC (deterministic — the spec requires this stay
 * documented and understandable, never an AI-generated priority):
 *
 * - category-score: most actions trace back to one of the Security
 *   Center's own category scores (0-100, higher = safer). Below 40 is
 *   critical, 40-59 is high, 60-79 is medium, 80+ is low (the
 *   recommendation is a polish suggestion, not a real gap).
 * - security-checklist-item: specific known-important gaps (MFA not
 *   enabled, no password manager) are always AT LEAST high priority
 *   regardless of the overall password score, because a single
 *   missing control like MFA has an outsized effect on real-world
 *   risk that an aggregate score can understate.
 * - threat-severity: mirrors the Threat Intelligence Dashboard's own
 *   real CVSS-derived severity scale directly — critical/high/medium/low
 *   map one-to-one, so this never invents a new severity system.
 * - learning-gap: an incomplete lesson relevant to an already-weak
 *   category is medium — useful, but education is a longer-term fix,
 *   not an urgent one.
 * - minor-improvement: general polish suggestions with no specific
 *   risk signal behind them are low.
 */
export type PriorityInput =
  | { kind: "category-score"; score: number }
  | { kind: "security-checklist-item" }
  | { kind: "threat-severity"; severity: ThreatSeverity }
  | { kind: "learning-gap" }
  | { kind: "minor-improvement" };

export function calculateActionPriority(input: PriorityInput): ActionPriority {
  switch (input.kind) {
    case "category-score":
      if (input.score < 40) return "critical";
      if (input.score < 60) return "high";
      if (input.score < 80) return "medium";
      return "low";
    case "security-checklist-item":
      return "high";
    case "threat-severity":
      return input.severity;
    case "learning-gap":
      return "medium";
    case "minor-improvement":
      return "low";
  }
}

export const PRIORITY_ORDER: Record<ActionPriority, number> = { critical: 3, high: 2, medium: 1, low: 0 };
