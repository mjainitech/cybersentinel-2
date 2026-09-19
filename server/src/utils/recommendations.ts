import type { CheckStatus, ScanCheckResult, Recommendation } from "../types";

type RuleFn = (check: ScanCheckResult) => Recommendation | null;

/**
 * One rule per check id. Each rule only fires for the status it cares
 * about — a rule returning null means "nothing worth recommending for
 * this finding." Keeping this as small, independent rules (rather
 * than one big conditional) makes it easy to add a rule for a new
 * check without touching the others.
 */
const RULES: Record<string, RuleFn> = {
  https: (check) =>
    check.status === "safe"
      ? null
      : {
          id: "avoid-sensitive-info",
          text: "Avoid entering passwords or payment information on this site.",
          reason: "Its connection isn't confirmed to be encrypted with HTTPS.",
          priority: check.status === "unknown" ? "warning" : check.status,
        },
  "ssl-certificate": (check) =>
    check.status === "danger"
      ? {
          id: "invalid-certificate",
          text: "Don't proceed past a certificate warning if your browser shows one.",
          reason: "This site's SSL certificate is invalid or has expired.",
          priority: "danger",
        }
      : null,
  "domain-age": (check) =>
    check.status === "warning"
      ? {
          id: "verify-new-domain",
          text: "Double-check that this is really the organization you expect.",
          reason: "This domain was registered very recently, which is common among short-lived scam sites.",
          priority: "warning",
        }
      : null,
  registrar: (check) =>
    check.status === "unknown"
      ? {
          id: "research-registrar",
          text: "Consider researching the company behind this site independently.",
          reason: "Registration details for this domain couldn't be verified.",
          priority: "warning",
        }
      : null,
  "malware-reputation": (check) =>
    check.status === "danger" || check.status === "warning"
      ? {
          id: "malware-flagged",
          text: "Consider avoiding this site until you can verify it's safe.",
          reason:
            check.status === "danger"
              ? "Multiple security vendors flagged this URL as malicious."
              : "At least one security vendor flagged this URL as suspicious.",
          priority: check.status,
        }
      : null,
  "community-verdict": (check) =>
    check.status === "danger"
      ? {
          id: "community-flagged",
          text: "Treat this site with significant caution.",
          reason: "An independent scan of this page's behavior flagged it as malicious.",
          priority: "danger",
        }
      : null,
  redirects: (check) =>
    check.status === "warning"
      ? {
          id: "check-final-url",
          text: "Check the URL in your address bar once the page finishes loading.",
          reason: "This link redirects through one or more other domains before landing on the final page.",
          priority: "warning",
        }
      : null,
  "security-headers": (check) =>
    check.status === "danger" || check.status === "warning"
      ? {
          id: "weak-headers",
          text: "This isn't necessarily dangerous, but it suggests weaker baseline security practices.",
          reason: "Several recommended security headers are missing from this site's responses.",
          priority: check.status,
        }
      : null,
};

const ALL_CLEAR: Recommendation = {
  id: "all-clear",
  text: "No immediate action needed for the checks that completed.",
  reason: "Every check that could be verified came back safe.",
  priority: "safe",
};

const PRIORITY_ORDER: Record<Exclude<CheckStatus, "unknown">, number> = { danger: 0, warning: 1, safe: 2 };
const MAX_RECOMMENDATIONS = 6;

/**
 * Builds a short, prioritized list of actionable recommendations from
 * this scan's actual findings — distinct from the AI explanation's
 * free-text "next steps": this list is deterministic, always
 * available even without an AI key, and traceable to one specific check each.
 */
export function generateRecommendations(checks: ScanCheckResult[]): Recommendation[] {
  const found = checks
    .map((check) => RULES[check.id]?.(check) ?? null)
    .filter((rec): rec is Recommendation => rec !== null)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, MAX_RECOMMENDATIONS);

  return found.length > 0 ? found : [ALL_CLEAR];
}
