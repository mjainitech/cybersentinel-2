import type { DetectedPiiItem, PiiCategory, PrivacyRating } from "../types";

/**
 * Penalty per category *present* (not per occurrence) — someone with
 * three project links shouldn't score worse than someone with one.
 * Contact info and professional profile links are expected on a
 * resume and cost nothing; the categories that actually enable
 * identity theft or unwanted contact cost the most.
 */
const CATEGORY_PENALTY: Record<PiiCategory, number> = {
  email: 3,
  phone: 3,
  linkedin: 0,
  github: 0,
  portfolio: 0,
  "personal-website": 3,
  address: 25,
  "date-of-birth": 20,
  "government-id": 40,
  "sensitive-other": 15,
};

export function calculatePrivacyScore(detected: DetectedPiiItem[]): number {
  const presentCategories = new Set(detected.map((item) => item.category));
  const totalPenalty = Array.from(presentCategories).reduce((sum, category) => sum + CATEGORY_PENALTY[category], 0);
  return Math.max(0, Math.min(100, 100 - totalPenalty));
}

export function getPrivacyRating(score: number): PrivacyRating {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "needs-improvement";
  return "high-risk";
}

export const PRIVACY_RATING_LABELS: Record<PrivacyRating, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-improvement": "Needs Improvement",
  "high-risk": "High Risk",
};
