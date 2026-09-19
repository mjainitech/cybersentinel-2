import type { CheckCategory } from "../types";

/**
 * Assigns each check to a report section. Kept centralized here
 * (rather than having each check service declare its own category)
 * so reorganizing the report layout never requires touching the
 * individual check services.
 */
const CHECK_CATEGORY_MAP: Record<string, CheckCategory> = {
  https: "connection",
  "ssl-certificate": "connection",
  "domain-age": "domain",
  registrar: "domain",
  dns: "domain",
  "ip-address": "technical",
  "security-headers": "technical",
  redirects: "technical",
  "malware-reputation": "reputation",
  "community-verdict": "reputation",
};

export function getCheckCategory(checkId: string): CheckCategory {
  return CHECK_CATEGORY_MAP[checkId] ?? "technical";
}

export const CATEGORY_LABELS: Record<CheckCategory, string> = {
  connection: "Connection Security",
  domain: "Domain Information",
  reputation: "Reputation",
  technical: "Technical Details",
};
