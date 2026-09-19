import type { AiExplanation, BreachRecord, ExposureRiskLevel } from "../types";

export function buildFallbackBreachExplanation(breaches: BreachRecord[], level: ExposureRiskLevel): AiExplanation {
  if (breaches.length === 0) {
    return {
      verdict: "No known breaches were found for this email in the database checked.",
      reasons: [
        "This means no matching records were found in the service checked — it does not guarantee this account has never been exposed anywhere.",
      ],
      risks: [],
      nextSteps: [
        "Use a unique password for every account.",
        "Enable multi-factor authentication where it's offered.",
        "Consider using a password manager.",
        "Stay alert for suspicious emails, even without a confirmed breach.",
      ],
      generatedByAi: false,
    };
  }

  const passwordExposed = breaches.some((b) => b.isPasswordExposed);
  const verdict =
    level === "severe" || level === "high"
      ? `This email was found in ${breaches.length} known breach${breaches.length === 1 ? "" : "es"}, including at least one where passwords were reportedly exposed.`
      : `This email was found in ${breaches.length} known breach${breaches.length === 1 ? "" : "es"}.`;

  const reasons = breaches.slice(0, 5).map((b) => `${b.title} (${b.breachDate || "date unknown"}) exposed: ${b.exposedCategories.join(", ")}.`);

  const risks: string[] = [];
  if (passwordExposed) {
    risks.push("If you've reused this password elsewhere, those other accounts could be at risk too — this is called credential stuffing.");
  }
  risks.push("Breached email addresses sometimes receive more targeted phishing attempts afterward, though not every suspicious email is necessarily related to this.");

  const recommendations = [
    passwordExposed ? "Change this account's password right away, and anywhere you reused it." : "Review this account's password just in case.",
    "Enable multi-factor authentication on this account.",
    "Watch for phishing emails or unexpected login attempts.",
    "Consider a password manager so you're never reusing passwords again.",
  ];

  return { verdict, reasons, risks, nextSteps: recommendations, generatedByAi: false };
}
