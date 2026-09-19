import type { LucideIcon } from "lucide-react";
import {
  Lock,
  FileCheck2,
  CalendarClock,
  Building2,
  Server,
  ListChecks,
  ArrowRightLeft,
  Network,
  ShieldAlert,
  Users,
  HelpCircle,
} from "lucide-react";
import { authHeader } from "@/services/authToken";

export type CheckStatus = "safe" | "warning" | "danger" | "unknown";

/** Which report section a check belongs to — assigned by the backend, used to group cards in the UI. */
export type CheckCategory = "connection" | "domain" | "reputation" | "technical";

export interface ScanCheck {
  id: string;
  title: string;
  /** The detected value shown at a glance, e.g. "Enabled", "3 years, 4 months". */
  value: string;
  /** One-sentence, site-specific explanation of this finding — comes from the backend. */
  summary: string;
  /** Generic explanation of what this check measures and why it matters — owned by the frontend. */
  learnMore: string;
  /** One-line definition shown in the hover tooltip — punchier than learnMore, same purpose at a glance. */
  glossary: string;
  status: CheckStatus;
  icon: LucideIcon;
  category: CheckCategory;
  /** Structured extras from the backend — e.g. { countryCode: "DE" } for the IP address check. */
  meta?: Record<string, string>;
}

export interface ScanReportMeta {
  /** True if one or more checks couldn't complete (API failure, timeout, missing key). */
  partial: boolean;
  unavailableChecks: string[];
  cached: boolean;
  cachedAt?: string;
  scannedAt: string;
}

export interface AiExplanation {
  /** One-sentence plain-language verdict. */
  verdict: string;
  reasons: string[];
  risks: string[];
  nextSteps: string[];
  /** False when this is the rule-based fallback rather than a real AI response. */
  generatedByAi: boolean;
}

export interface Recommendation {
  id: string;
  text: string;
  reason: string;
  priority: Exclude<CheckStatus, "unknown">;
}

export interface ScanReport {
  url: string;
  score: number;
  band: Exclude<CheckStatus, "unknown">;
  rating: "A" | "B" | "C" | "D" | "F";
  confidence: "high" | "medium" | "low";
  recommendation: string;
  checks: ScanCheck[];
  recommendations: Recommendation[];
  aiExplanation: AiExplanation;
  meta: ScanReportMeta;
}

/** Raw shape returned by the backend for a single check — no icon or "Learn More" copy attached yet. */
export interface RawScanCheck {
  id: string;
  title: string;
  value: string;
  summary: string;
  status: CheckStatus;
  category: CheckCategory;
  meta?: Record<string, string>;
}

export interface RawScanReport {
  url: string;
  score: number;
  band: Exclude<CheckStatus, "unknown">;
  rating: "A" | "B" | "C" | "D" | "F";
  confidence: "high" | "medium" | "low";
  recommendation: string;
  checks: RawScanCheck[];
  recommendations: Recommendation[];
  aiExplanation: AiExplanation;
  meta: ScanReportMeta;
}

/** Rotating messages shown by ScanLoader while a scan runs — the real backend call takes a few seconds. */
export const scanStages = [
  "Checking HTTPS...",
  "Analyzing domain...",
  "Checking security reputation...",
  "Generating report...",
];

/**
 * Icons are a frontend-only concern — the backend has no notion of
 * Lucide components. Keyed by check id so any check the backend adds
 * shows up with a sensible fallback even before this map is updated.
 */
const CHECK_ICONS: Record<string, LucideIcon> = {
  https: Lock,
  "ssl-certificate": FileCheck2,
  "domain-age": CalendarClock,
  registrar: Building2,
  "ip-address": Server,
  "security-headers": ListChecks,
  redirects: ArrowRightLeft,
  dns: Network,
  "malware-reputation": ShieldAlert,
  "community-verdict": Users,
};

/**
 * "Learn More" copy is generic education content, independent of any
 * specific scan result — it belongs with the UI, not the API response.
 */
const CHECK_LEARN_MORE: Record<string, string> = {
  https:
    "HTTPS encrypts the connection between your browser and the website, so anything you type — passwords, card numbers, messages — can't be read or altered by someone else on the network. A missing or broken HTTPS connection is one of the clearest signs a site isn't ready to handle sensitive information.",
  "ssl-certificate":
    "An SSL/TLS certificate proves a site's identity and enables HTTPS. Certificates are issued by trusted authorities and expire on a schedule — an expired, self-signed, or mismatched certificate is a common warning sign, though not always proof of malicious intent.",
  "domain-age":
    "Domain age is how long a domain has been registered. Scam and phishing sites are frequently registered days or weeks before use and abandoned shortly after, so a very new domain is a meaningful (though not conclusive) risk signal, especially combined with other red flags.",
  registrar:
    "The registrar is the company a domain was purchased through. This on its own doesn't indicate safety, but privacy-shielded registrations combined with a brand-new domain are worth factoring into your overall judgment.",
  "ip-address":
    "Every website resolves to an IP address on a hosting provider. Checking the IP's reputation and geographic location can surface sites hidden behind bulletproof hosting or previously flagged for abuse — useful context, but many legitimate sites also use shared or overseas hosting.",
  "security-headers":
    "Security headers (like Content-Security-Policy or Strict-Transport-Security) tell your browser how to handle the page safely — for example, blocking certain script injection attacks. Missing headers don't mean a site is malicious, but they indicate weaker baseline hardening.",
  redirects:
    "Redirects send visitors from one URL to another. A single redirect (like upgrading to HTTPS or www) is normal. Multiple chained redirects, or a redirect to an unrelated domain, are common tactics used to disguise a phishing destination behind a trustworthy-looking link.",
  dns: "DNS records control how a domain name maps to servers and services. Unusual DNS configurations — mismatched nameservers, very short record lifetimes, or records pointing to known-bad infrastructure — can indicate a domain was hijacked or set up specifically for short-lived abuse.",
  "malware-reputation":
    "This check aggregates verdicts from dozens of security vendors (via VirusTotal) that have independently analyzed this URL. A flag from even a few vendors is worth taking seriously, though occasional false positives happen — especially on brand-new or low-traffic sites.",
  "community-verdict":
    "This check reflects an independent, automated inspection of the page's actual content and behavior (via URLScan.io) — things like scripts it loads and forms it submits to — rather than just its reputation history.",
};

const FALLBACK_LEARN_MORE = "No additional detail is available for this check yet.";

/**
 * One-line definitions shown in hover tooltips — quicker to scan than
 * the full "Learn More" paragraph, meant for someone who just wants a
 * reminder of what a term means without opening anything.
 */
const CHECK_GLOSSARY: Record<string, string> = {
  https: "Encrypts your connection to the site so others on the network can't read it.",
  "ssl-certificate": "A certificate that proves the site's identity and enables HTTPS.",
  "domain-age": "How long this domain has been registered.",
  registrar: "The company this domain was registered through.",
  "ip-address": "The server address hosting this site, and where it's physically located.",
  "security-headers": "Browser instructions that help block common web attacks.",
  redirects: "Other pages this link sends you through before you land on the final page.",
  dns: "Records that map this domain name to its servers.",
  "malware-reputation": "Verdicts from dozens of security vendors, via VirusTotal.",
  "community-verdict": "An independent, automated inspection of what the page actually does.",
};
const FALLBACK_GLOSSARY = "A technical check run as part of this scan.";

/** Display order and labels for grouping checks into report sections. */
export const CATEGORY_ORDER: CheckCategory[] = ["connection", "domain", "reputation", "technical"];
export const CATEGORY_LABELS: Record<CheckCategory, string> = {
  connection: "Connection Security",
  domain: "Domain Information",
  reputation: "Reputation",
  technical: "Technical Details",
};

/** Groups checks into their report sections, in a fixed display order, omitting empty sections. */
export function groupChecksByCategory(checks: ScanCheck[]): Array<{ category: CheckCategory; checks: ScanCheck[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    checks: checks.filter((check) => check.category === category),
  })).filter((group) => group.checks.length > 0);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

/**
 * Attaches frontend-only concerns (icon, "Learn More" copy) to raw
 * checks from the backend. Exported so any page that has a raw report
 * — whether from a fresh scan or a saved history record — can render
 * it with the same ScanResultCard components.
 */
export function enrichChecks(rawChecks: RawScanCheck[]): ScanCheck[] {
  return rawChecks.map((check) => ({
    ...check,
    icon: CHECK_ICONS[check.id] ?? HelpCircle,
    learnMore: CHECK_LEARN_MORE[check.id] ?? FALLBACK_LEARN_MORE,
    glossary: CHECK_GLOSSARY[check.id] ?? FALLBACK_GLOSSARY,
  }));
}

/** Converts a raw backend report into the enriched shape the UI components expect. */
export function toScanReport(raw: RawScanReport): ScanReport {
  return { ...raw, checks: enrichChecks(raw.checks) };
}

/**
 * Calls the real backend scan endpoint (see /server). The backend
 * owns every third-party API key and does the actual VirusTotal,
 * URLScan, WHOIS, and IP geolocation lookups — this function only
 * talks to our own API and enriches the response with frontend-only
 * concerns (icons, "Learn More" copy). If the caller is signed in
 * (see authToken.ts), the backend also saves this scan to their history.
 */
export async function runWebsiteScan(url: string): Promise<ScanReport> {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong while scanning. Please try again.");
  }

  const raw: RawScanReport = await response.json();
  return toScanReport(raw);
}
