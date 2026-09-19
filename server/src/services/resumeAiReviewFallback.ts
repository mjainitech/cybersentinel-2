import { PII_CATEGORY_LABELS } from "../services/piiDetection";
import type { DetectedPiiItem, PrivacyRating, ResumeAiReview } from "../types";

/**
 * Builds a beginner-friendly privacy review directly from the
 * detected items, no AI involved. Used whenever the AI call can't
 * run — missing key, timeout, bad response — so the review card
 * always has something useful rather than an error or a blank space.
 */
export function buildFallbackResumeReview(detected: DetectedPiiItem[], rating: PrivacyRating): ResumeAiReview {
  const categories = new Set(detected.map((item) => item.category));

  const summary =
    rating === "excellent"
      ? "Your resume shares standard contact details without unnecessary personal information."
      : rating === "good"
      ? "Your resume looks mostly fine, with a couple of details worth a second look."
      : rating === "needs-improvement"
      ? "Your resume includes some personal information that most people choose to leave off a public resume."
      : "Your resume includes sensitive personal information that's worth removing before sharing it further.";

  const foundInfo = detected.map(
    (item) => `${PII_CATEGORY_LABELS[item.category]} was found on your resume.`
  );

  const risks: string[] = [];
  if (categories.has("address")) {
    risks.push("A home address makes it easier for someone to identify where you live.");
  }
  if (categories.has("date-of-birth")) {
    risks.push("A birth date is often used to verify identity, so sharing it publicly is a real privacy risk.");
  }
  if (categories.has("government-id")) {
    risks.push("A government ID number is highly sensitive and shouldn't appear on a resume at all.");
  }
  if (categories.has("sensitive-other")) {
    risks.push("Some other personal information was found that may not be necessary on a resume.");
  }

  const recommendations =
    rating === "excellent" || rating === "good"
      ? ["No urgent changes needed — keep reviewing your resume before sharing it on new platforms."]
      : [
          "Remove any information that isn't necessary for an employer to make contact or evaluate your work.",
          "Keep contact info limited to an email address and phone number where possible.",
        ];

  return { summary, foundInfo, risks, recommendations, generatedByAi: false };
}
