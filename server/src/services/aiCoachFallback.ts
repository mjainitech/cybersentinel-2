import type { CoachTopic } from "../utils/aiCoachTopics";
import { detectTopics } from "../utils/aiCoachTopics";

const TOPIC_BLURBS: Partial<Record<CoachTopic, string>> = {
  password: "Strong passwords are long, unique per account, and paired with multi-factor authentication (MFA) wherever it's offered.",
  phishing: "Phishing emails often combine urgency with a request for sensitive information or payment — that combination is the biggest red flag.",
  privacy:
    "Sharing only the personal information actually needed for a given purpose (data minimization) is the core idea behind reducing your privacy exposure.",
  website:
    "A website's reputation — domain age, certificate details, and prior flags — is a useful signal, though HTTPS alone doesn't guarantee a site is trustworthy.",
  breach:
    "A breach check finding no results means no matching record was found in that specific database — not a guarantee your information was never exposed anywhere.",
  malware: "Most malware infections trace back to a small number of common triggers: unexpected attachments, sketchy downloads, and out-of-date software.",
  learning: "The Learning Hub has short lessons on fundamentals, online safety, phishing, web security, malware, privacy, and application security.",
  threat: "The Threat Intelligence Dashboard tracks real vulnerabilities from NVD alongside curated, sourced information on common attack trends.",
  analytics: "Security Analytics shows how your scores have changed over time, based on your own saved CyberSentinel activity.",
};

/**
 * Builds a genuinely useful reply from the same context string the
 * real AI would have used, plus a topic-relevant educational blurb —
 * so the chat stays useful even when the AI call fails or no API key
 * is configured, rather than just showing an error.
 */
export function buildFallbackCoachReply(message: string, context: string): string {
  const topics = detectTopics(message);
  const blurb = topics.map((t) => TOPIC_BLURBS[t]).find((b) => b !== undefined);

  const parts = ["I can't generate a fully personalized answer right now, but here's what I can tell you from your CyberSentinel data:", "", context];

  if (blurb) {
    parts.push("", blurb);
  }

  parts.push(
    "",
    "For a deeper answer, please try again in a moment. Remember, I'm an educational assistant, not a substitute for a professional cybersecurity consultation."
  );

  return parts.join("\n");
}
