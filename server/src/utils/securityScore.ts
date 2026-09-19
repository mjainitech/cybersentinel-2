import type { SecurityCategoryResult, SecurityGrade } from "../types";

/**
 * METHODOLOGY (also surfaced to the user via scoringMethodology below):
 *
 * The overall score is the simple average of every category that
 * currently HAS data, each weighted equally. A category with no
 * underlying activity (hasData: false) is excluded entirely rather
 * than being scored as 0 or defaulted to some assumed value — that
 * would misrepresent "haven't checked yet" as "failing."
 *
 * "Cybersecurity Education" always reports hasData: false today,
 * since there's no Learning Hub yet to generate real completion data
 * — it's included in the category list so the UI has a permanent slot
 * for it, but it never contributes to the score until that data exists.
 *
 * This is an educational indicator, not a certified security audit —
 * it only reflects what's visible from activity inside CyberSentinel.
 */
export function getGrade(score: number): SecurityGrade {
  if (score >= 97) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

export interface OverallScoreResult {
  overallScore: number | null;
  grade: SecurityGrade | null;
  categoriesWithData: number;
  scoringMethodology: string[];
}

export function calculateOverallScore(categories: SecurityCategoryResult[]): OverallScoreResult {
  const scored = categories.filter((c) => c.hasData && c.score !== null);

  const scoringMethodology = [
    "Your overall score is the simple average of every category below that has activity — categories with no data yet don't count for or against you.",
    "Each category is scored 0–100 based only on your saved results already inside CyberSentinel: past website scans, resume checks, email analyses, password assessments, and breach checks.",
    "This is an educational summary, not a professional security certification — it reflects only what's visible to CyberSentinel, not your overall real-world security.",
  ];

  if (scored.length === 0) {
    return { overallScore: null, grade: null, categoriesWithData: 0, scoringMethodology };
  }

  const total = scored.reduce((sum, c) => sum + (c.score ?? 0), 0);
  const overallScore = Math.round(total / scored.length);

  return { overallScore, grade: getGrade(overallScore), categoriesWithData: scored.length, scoringMethodology };
}
