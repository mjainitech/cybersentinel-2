import type { BreachRecord, ExposureRiskLevel, ExposureRiskScore } from "../types";

/**
 * Scoring is deliberately simple and fully explainable — every factor
 * below is surfaced back to the user via the "factors" array, shown
 * in the "How is this score calculated?" section. This is NOT a
 * scientifically calibrated probability of harm; it's a transparent,
 * relative indicator meant to guide action, not a precise measurement.
 */
const POINTS_PER_BREACH = 12;
const MAX_BREACH_COUNT_POINTS = 60;
const PASSWORD_EXPOSED_POINTS = 25;
const SENSITIVE_BREACH_POINTS = 10;
const RECENT_BREACH_POINTS = 10;
const RECENT_BREACH_WINDOW_DAYS = 365;

function getLevel(score: number): ExposureRiskLevel {
  if (score >= 70) return "severe";
  if (score >= 45) return "high";
  if (score >= 20) return "moderate";
  return "low";
}

export function calculateExposureRiskScore(breaches: BreachRecord[]): ExposureRiskScore {
  if (breaches.length === 0) {
    return {
      score: 0,
      level: "low",
      factors: ["No breaches were found for this email in the service checked."],
    };
  }

  const factors: string[] = [];
  let score = 0;

  const breachCountPoints = Math.min(breaches.length * POINTS_PER_BREACH, MAX_BREACH_COUNT_POINTS);
  score += breachCountPoints;
  factors.push(`Found in ${breaches.length} known breach${breaches.length === 1 ? "" : "es"} (+${breachCountPoints} points).`);

  const passwordExposedCount = breaches.filter((b) => b.isPasswordExposed).length;
  if (passwordExposedCount > 0) {
    score += PASSWORD_EXPOSED_POINTS;
    factors.push(
      `Passwords were reported as exposed in ${passwordExposedCount} breach${passwordExposedCount === 1 ? "" : "es"} (+${PASSWORD_EXPOSED_POINTS} points).`
    );
  }

  const sensitiveCount = breaches.filter((b) => b.isSensitive).length;
  if (sensitiveCount > 0) {
    score += SENSITIVE_BREACH_POINTS;
    factors.push(
      `${sensitiveCount} breach${sensitiveCount === 1 ? "" : "es"} involved especially sensitive categories of data (+${SENSITIVE_BREACH_POINTS} points).`
    );
  }

  const now = Date.now();
  const hasRecentBreach = breaches.some((b) => {
    const added = new Date(b.addedDate).getTime();
    return !Number.isNaN(added) && now - added <= RECENT_BREACH_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  });
  if (hasRecentBreach) {
    score += RECENT_BREACH_POINTS;
    factors.push(`At least one breach was added to the database within the last year (+${RECENT_BREACH_POINTS} points).`);
  }

  score = Math.max(0, Math.min(100, score));

  return { score, level: getLevel(score), factors };
}
