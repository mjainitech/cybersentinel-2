import type { EmailIndicator, EmailIndicatorCategory, ExtractedEmailLink } from "../types";

/**
 * Like the resume scanner's PII detection, every detector here is
 * regex/keyword-based, not true NLP or a machine-learned classifier.
 * It's transparent pattern matching for well-known phishing tactics —
 * genuinely useful for catching common cases, but not a guarantee.
 * Sophisticated, well-crafted phishing can still slip past keyword matching.
 */

const URGENT_PHRASES = [
  "act now",
  "act immediately",
  "urgent action required",
  "immediate action required",
  "verify your account",
  "your account will be",
  "account has been suspended",
  "account will be suspended",
  "account will be locked",
  "expires today",
  "expires within",
  "within 24 hours",
  "within 48 hours",
  "final notice",
  "immediately or",
  "failure to respond",
  "time-sensitive",
  "time sensitive",
];

const CREDENTIAL_PHRASES = [
  "confirm your password",
  "verify your password",
  "enter your password",
  "update your password",
  "verify your identity",
  "confirm your identity",
  "login to your account",
  "log in to your account",
  "sign in to verify",
  "update your payment information",
  "confirm your billing information",
  "re-enter your credentials",
  "verify your ssn",
  "confirm your social security",
];

const PAYMENT_PHRASES = [
  "wire transfer",
  "gift card",
  "gift cards",
  "invoice attached",
  "invoice is attached",
  "payment is overdue",
  "overdue invoice",
  "bank details",
  "banking information",
  "routing number",
  "western union",
  "bitcoin",
  "cryptocurrency payment",
  "purchase a gift card",
];

const THREATENING_PHRASES = [
  "legal action",
  "will be suspended",
  "will be terminated",
  "will be permanently closed",
  "account has been locked",
  "unauthorized access detected",
  "suspicious activity detected",
  "we have detected unusual",
  "failure to comply",
];

const SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
]);

/** Well-known brands and their real domains — used to flag sender/body mentions that don't match. */
const KNOWN_BRAND_DOMAINS: Record<string, string> = {
  paypal: "paypal.com",
  apple: "apple.com",
  microsoft: "microsoft.com",
  amazon: "amazon.com",
  google: "google.com",
  netflix: "netflix.com",
  "bank of america": "bankofamerica.com",
  chase: "chase.com",
  wellsfargo: "wellsfargo.com",
  "wells fargo": "wellsfargo.com",
  irs: "irs.gov",
  usps: "usps.com",
  fedex: "fedex.com",
  dhl: "dhl.com",
  ups: "ups.com",
  facebook: "facebook.com",
  instagram: "instagram.com",
  linkedin: "linkedin.com",
};

const EXECUTABLE_EXTENSIONS = [".exe", ".scr", ".bat", ".cmd", ".vbs", ".js", ".jar", ".msi", ".ps1"];

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

function findAllPhraseMatches(
  text: string,
  phrases: string[],
  category: EmailIndicatorCategory,
  severity: EmailIndicator["severity"],
  label: string,
  explanation: string
): EmailIndicator[] {
  const lowerText = text.toLowerCase();
  const results: EmailIndicator[] = [];

  for (const phrase of phrases) {
    let searchFrom = 0;
    let foundAt = lowerText.indexOf(phrase, searchFrom);
    while (foundAt !== -1) {
      results.push({
        category,
        label,
        explanation,
        severity,
        index: foundAt,
        length: phrase.length,
        matchedText: text.slice(foundAt, foundAt + phrase.length),
      });
      searchFrom = foundAt + phrase.length;
      foundAt = lowerText.indexOf(phrase, searchFrom);
    }
  }

  return results;
}

/** Extracts the sender's display name and email address from a "From:" style line, e.g. `From: PayPal <no-reply@paypal-security.ru>`. */
function parseSenderLine(text: string): { displayName?: string; email?: string; domain?: string } {
  const fromMatch = text.match(/^from:\s*(.+)$/im);
  if (!fromMatch) return {};

  const line = fromMatch[1].trim();
  const emailMatch = line.match(/<?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})>?/i);
  const email = emailMatch?.[1];
  const domain = email?.split("@")[1]?.toLowerCase();
  const displayName = line.replace(/<.*>/, "").trim().replace(/^"|"$/g, "");

  return { displayName: displayName || undefined, email, domain };
}

function detectSenderIndicators(text: string): EmailIndicator[] {
  const indicators: EmailIndicator[] = [];
  const { displayName, domain } = parseSenderLine(text);

  if (!displayName || !domain) return indicators;

  const lowerDisplayName = displayName.toLowerCase();

  for (const [brand, realDomain] of Object.entries(KNOWN_BRAND_DOMAINS)) {
    if (lowerDisplayName.includes(brand) && !domain.endsWith(realDomain)) {
      indicators.push({
        category: "brand-impersonation",
        label: "Brand Impersonation",
        explanation: `The sender name mentions "${brand}", but the actual email domain ("${domain}") doesn't match ${brand}'s real domain (${realDomain}).`,
        severity: "high",
      });
      indicators.push({
        category: "sender-mismatch",
        label: "Sender Name / Domain Mismatch",
        explanation: `The display name "${displayName}" doesn't match the actual sending domain "${domain}".`,
        severity: "high",
      });
      break;
    }
  }

  // Reply-To pointing somewhere different from From is a classic BEC tactic.
  const replyToMatch = text.match(/^reply-to:\s*.*<?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})>?/im);
  const replyToDomain = replyToMatch?.[1]?.split("@")[1]?.toLowerCase();
  if (replyToDomain && replyToDomain !== domain) {
    indicators.push({
      category: "sender-mismatch",
      label: "Reply-To Mismatch",
      explanation: `Replies to this email would go to a different domain ("${replyToDomain}") than the one it was sent from ("${domain}").`,
      severity: "medium",
    });
  }

  return indicators;
}

function detectSuspiciousDomains(links: ExtractedEmailLink[]): EmailIndicator[] {
  const indicators: EmailIndicator[] = [];

  for (const link of links) {
    if (link.isIpAddress) {
      indicators.push({
        category: "suspicious-domain",
        label: "IP Address Link",
        explanation: `This link points directly to an IP address (${link.domain}) instead of a normal domain name — a tactic sometimes used to avoid domain-based reputation checks.`,
        severity: "high",
        matchedText: link.url,
      });
    }
    if (link.isShortened) {
      indicators.push({
        category: "suspicious-domain",
        label: "Shortened URL",
        explanation: `This link uses a URL shortener (${link.domain}), which hides the real destination until you click it.`,
        severity: "medium",
        matchedText: link.url,
      });
    }
  }

  return indicators;
}

function detectGrammarSignals(text: string): EmailIndicator[] {
  const indicators: EmailIndicator[] = [];

  const excessiveExclamations = text.match(/!{2,}/g)?.length ?? 0;
  if (excessiveExclamations >= 2) {
    indicators.push({
      category: "grammar-spelling",
      label: "Excessive Punctuation",
      explanation:
        "Multiple groups of repeated exclamation marks were found — a rough style signal sometimes associated with pressure tactics, not a grammar check.",
      severity: "low",
    });
  }

  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const allCapsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (words.length > 0 && allCapsWords.length / words.length > 0.15) {
    indicators.push({
      category: "grammar-spelling",
      label: "Unusual Capitalization",
      explanation: "An unusually high proportion of this email is written in ALL CAPS, a common pressure tactic.",
      severity: "low",
    });
  }

  return indicators;
}

function detectAuthenticationFailures(text: string): EmailIndicator[] {
  const indicators: EmailIndicator[] = [];
  const authMatch = text.match(/^authentication-results:\s*(.+)$/im);
  if (!authMatch) return indicators;

  const line = authMatch[1].toLowerCase();
  const failedChecks: string[] = [];
  if (/spf=fail/.test(line)) failedChecks.push("SPF");
  if (/dkim=fail/.test(line)) failedChecks.push("DKIM");
  if (/dmarc=fail/.test(line)) failedChecks.push("DMARC");

  if (failedChecks.length > 0) {
    indicators.push({
      category: "sender-mismatch",
      label: "Failed Email Authentication",
      explanation: `This email failed ${failedChecks.join(", ")} authentication — a strong technical signal that it wasn't actually sent by the domain it claims to be from.`,
      severity: "high",
    });
  }

  return indicators;
}

export function detectAttachmentRisk(filename: string): string[] {
  const lower = filename.toLowerCase();
  const risks: string[] = [];

  if (EXECUTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    risks.push("This is an executable file type — executable attachments are a common way malware spreads over email.");
  }

  const extensionCount = (lower.match(/\./g) ?? []).length;
  if (extensionCount >= 2) {
    const parts = lower.split(".");
    const secondToLast = parts[parts.length - 2];
    if (["pdf", "doc", "docx", "jpg", "png", "txt"].includes(secondToLast)) {
      risks.push(
        `This filename has a double extension (looks like a ".${secondToLast}" file but isn't) — a known technique for disguising executables.`
      );
    }
  }

  if (risks.length === 0) {
    risks.push("No obvious file-type red flags were found, but malware scanning of the file's actual contents isn't available yet.");
  }

  return risks;
}

export function extractLinks(text: string): ExtractedEmailLink[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const seen = new Set<string>();
  const links: ExtractedEmailLink[] = [];

  for (const match of matches) {
    if (seen.has(match)) continue;
    seen.add(match);

    try {
      const parsed = new URL(match);
      const domain = parsed.hostname;
      links.push({
        url: match,
        domain,
        protocol: parsed.protocol.replace(":", ""),
        isShortened: SHORTENER_DOMAINS.has(domain.toLowerCase()),
        isIpAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain),
        isHttps: parsed.protocol === "https:",
      });
    } catch {
      // Not a parseable URL despite matching the regex — skip it rather than guess.
    }
  }

  return links;
}

export function detectEmailIndicators(text: string, links: ExtractedEmailLink[]): EmailIndicator[] {
  return [
    ...findAllPhraseMatches(
      text,
      URGENT_PHRASES,
      "urgent-language",
      "medium",
      "Urgency Tactic",
      "Phrases like this create false time pressure, a common tactic to rush you into acting without thinking."
    ),
    ...findAllPhraseMatches(
      text,
      CREDENTIAL_PHRASES,
      "credential-request",
      "high",
      "Credential Request",
      "Legitimate organizations rarely ask you to re-enter your password or verify your identity by clicking an email link."
    ),
    ...findAllPhraseMatches(
      text,
      PAYMENT_PHRASES,
      "payment-request",
      "high",
      "Payment Request",
      "Requests for gift cards, wire transfers, or banking details by email are a hallmark of financial scams."
    ),
    ...findAllPhraseMatches(
      text,
      THREATENING_PHRASES,
      "threatening-language",
      "medium",
      "Threatening Language",
      "Threats of account closure or legal action are used to provoke fear and rushed decisions."
    ),
    ...detectSenderIndicators(text),
    ...detectAuthenticationFailures(text),
    ...detectSuspiciousDomains(links),
    ...detectGrammarSignals(text),
  ];
}
