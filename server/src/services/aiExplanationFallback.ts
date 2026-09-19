import type { AiExplanation, CheckStatus, ScanCheckResult } from "../types";

/**
 * Builds a beginner-friendly explanation directly from the check
 * results, no AI involved. Used whenever the AI call can't run —
 * missing key, timeout, bad response — so the AI Assistant card
 * always has something useful to show rather than an error or a
 * blank space.
 */
export function buildFallbackExplanation(
  band: Exclude<CheckStatus, "unknown">,
  checks: ScanCheckResult[]
): AiExplanation {
  const verdict =
    band === "safe"
      ? "This website appears safe to visit."
      : band === "warning"
      ? "This website should be approached with some caution."
      : "This website has multiple security concerns.";

  const reasons = checks
    .filter((check) => check.status === "safe")
    .map((check) => plainLanguageReason(check));

  const risks = checks
    .filter((check) => check.status === "warning" || check.status === "danger")
    .map((check) => plainLanguageRisk(check));

  const nextSteps =
    band === "safe"
      ? ["No action needed, but it's always smart to stay cautious with personal information online."]
      : band === "warning"
      ? [
          "Think twice before entering passwords, personal details, or payment information on this site.",
          "If something feels off, look up the site by name in a search engine to see what others say about it.",
        ]
      : [
          "Avoid entering any personal information, passwords, or payment details on this site.",
          "Avoid downloading anything from this site until you can verify it's legitimate.",
        ];

  return { verdict, reasons, risks, nextSteps, generatedByAi: false };
}

function plainLanguageReason(check: ScanCheckResult): string {
  const templates: Record<string, string> = {
    https: "This site uses HTTPS, which helps protect your connection.",
    "ssl-certificate": "Its security certificate is valid and issued by a trusted authority.",
    "domain-age": "The domain has an established history rather than being brand new.",
    registrar: "The domain's registration details show nothing unusual.",
    "ip-address": "The site's hosting location and IP address show nothing unusual.",
    "security-headers": "The site sends the recommended security headers that help protect visitors.",
    redirects: "The page loads directly without any unexpected redirects.",
    dns: "The domain's DNS records are configured normally.",
    "malware-reputation": "Security vendors haven't flagged this link as malicious.",
    "community-verdict": "Independent scans of this page found no malicious behavior.",
  };
  return templates[check.id] ?? `${check.title}: ${check.summary}`;
}

function plainLanguageRisk(check: ScanCheckResult): string {
  const templates: Record<string, string> = {
    https: "This site doesn't use HTTPS, so information you enter could be exposed on the network.",
    "ssl-certificate": "There's a problem with this site's security certificate.",
    "domain-age":
      "This domain was registered very recently, which can sometimes be associated with phishing websites.",
    registrar: "Something about this domain's registration details looks unusual.",
    "ip-address": "The site's hosting details couldn't be fully verified.",
    "security-headers": "This site is missing some recommended security protections.",
    redirects:
      "The website redirects through multiple domains. This can be normal but may also be used by malicious sites.",
    dns: "This domain's DNS records show something unusual.",
    "malware-reputation": "Some security vendors have flagged this link as suspicious or malicious.",
    "community-verdict": "An independent scan of this page found suspicious behavior.",
  };
  return templates[check.id] ?? `${check.title}: ${check.summary}`;
}
