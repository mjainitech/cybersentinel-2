import type { DetectedPiiItem, PiiCategory, ResumeRecommendation } from "../types";

type RuleFn = (items: DetectedPiiItem[]) => ResumeRecommendation | null;

const RULES: Partial<Record<PiiCategory, RuleFn>> = {
  address: () => ({
    id: "remove-address",
    text: "Consider removing your full home address.",
    reason:
      "Employers rarely need a street address before an interview, and a resume is often shared or posted more widely than intended — a full address makes it easier for someone to physically locate you.",
    priority: "high",
  }),
  "date-of-birth": () => ({
    id: "remove-dob",
    text: "Remove your date of birth.",
    reason:
      "A birth date is commonly used to verify identity for accounts and services, and including it on a resume — combined with your name — makes identity theft meaningfully easier. It's also not something employers are legally supposed to use in hiring decisions.",
    priority: "high",
  }),
  "government-id": () => ({
    id: "remove-government-id",
    text: "Remove this ID number immediately.",
    reason:
      "A Social Security number, passport number, or similar government ID should never appear on a resume. This is one of the most sensitive pieces of information there is, and no employer needs it at this stage.",
    priority: "high",
  }),
  "personal-website": () => ({
    id: "review-personal-site",
    text: "Double-check what your personal website reveals.",
    reason:
      "If you link a personal site, make sure it doesn't expose more than you'd want a stranger reading your resume to know — home photos, family details, or an old blog, for example.",
    priority: "low",
  }),
  "sensitive-other": () => ({
    id: "review-sensitive-other",
    text: "Review any other personal details for necessity.",
    reason: "Some information found doesn't clearly belong in a professional resume — consider whether it needs to be there.",
    priority: "medium",
  }),
};

const EMAIL_PROFESSIONALISM_TIP: ResumeRecommendation = {
  id: "professional-email",
  text: "Make sure your email address looks professional.",
  reason:
    "Something like firstname.lastname@email.com reads better to employers than an old nickname-based address, and it reveals less about you personally (age, interests, etc.) than a casual handle might.",
  priority: "low",
};

const ALL_CLEAR: ResumeRecommendation = {
  id: "all-clear",
  text: "No major privacy concerns found.",
  reason:
    "Your resume includes standard contact information without unnecessary personal identifiers — that's a good balance between being reachable and staying private.",
  priority: "low",
};

const PRIORITY_ORDER: Record<ResumeRecommendation["priority"], number> = { high: 0, medium: 1, low: 2 };

/**
 * Builds a short, prioritized list of recommendations tied to what
 * was actually found. Every rule fires independently, so adding a
 * new one for a future PII category never affects the others.
 */
export function generateResumeRecommendations(detected: DetectedPiiItem[]): ResumeRecommendation[] {
  const categories = new Set(detected.map((item) => item.category));
  const recommendations: ResumeRecommendation[] = [];

  for (const category of categories) {
    const rule = RULES[category];
    const result = rule?.(detected);
    if (result) recommendations.push(result);
  }

  if (categories.has("email")) {
    recommendations.push(EMAIL_PROFESSIONALISM_TIP);
  }

  recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return recommendations.length > 0 ? recommendations : [ALL_CLEAR];
}
