import { EMAIL_CLASSIFICATION_LABELS } from "../utils/emailRiskScore";
import type { AiExplanation, EmailIndicator, EmailRiskClassification } from "../types";

/**
 * Builds a beginner-friendly explanation directly from the detected
 * indicators, no AI involved — used whenever the AI call can't run.
 * Mirrors aiExplanationFallback.ts's approach for the Website Scanner.
 */
export function buildFallbackEmailExplanation(
  indicators: EmailIndicator[],
  classification: EmailRiskClassification
): AiExplanation {
  const verdict =
    classification === "likely-safe"
      ? "This email doesn't show the common warning signs of phishing."
      : classification === "use-caution"
      ? "This email is probably fine, but has a couple of details worth a second look."
      : classification === "suspicious"
      ? "This email shows several signs commonly associated with phishing."
      : "This email shows strong signs of being a phishing attempt.";

  const categories = new Set(indicators.map((indicator) => indicator.category));
  const reasons: string[] = [];

  if (categories.has("brand-impersonation")) {
    reasons.push("The sender appears to be impersonating a well-known brand.");
  }
  if (categories.has("sender-mismatch")) {
    reasons.push("The sender's display name doesn't match where the email actually came from or where replies would go.");
  }
  if (categories.has("credential-request")) {
    reasons.push("The email asks you to enter a password or verify your identity.");
  }
  if (categories.has("payment-request")) {
    reasons.push("The email requests a payment, gift card, or banking information.");
  }
  if (categories.has("urgent-language")) {
    reasons.push("The email uses urgent language to pressure a fast response.");
  }
  if (categories.has("threatening-language")) {
    reasons.push("The email threatens a negative consequence, like account closure.");
  }
  if (categories.has("suspicious-domain")) {
    reasons.push("At least one link uses a shortened URL or points directly to an IP address.");
  }
  if (categories.has("suspicious-attachment")) {
    reasons.push("The attached file has characteristics sometimes used to disguise malware.");
  }
  if (reasons.length === 0) {
    reasons.push(`This email scored as "${EMAIL_CLASSIFICATION_LABELS[classification]}" with no major indicators detected.`);
  }

  const risks: string[] = [];
  if (categories.has("credential-request") || categories.has("brand-impersonation")) {
    risks.push("Clicking links or entering credentials could hand over account access to someone else.");
  }
  if (categories.has("payment-request")) {
    risks.push("Following payment instructions in this email could result in direct financial loss.");
  }

  const nextSteps =
    classification === "likely-safe"
      ? ["Still verify anything unexpected by contacting the sender directly through a known, separate channel."]
      : [
          "Verify the sender independently — don't reply to this email to do it.",
          "Avoid clicking any links or downloading attachments from this email.",
          "If it claims to be from an organization you use, contact them through their official website or app instead.",
        ];

  return { verdict, reasons, risks, nextSteps, generatedByAi: false };
}
