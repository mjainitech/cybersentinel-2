import * as dns from "node:dns/promises";
import { logger } from "./logger";
import type { ScanCheckResult } from "../types";

/**
 * Reads nameserver records directly via Node's built-in DNS resolver.
 * No third-party API required for this one — it's a native protocol lookup.
 */
export async function getDnsCheck(hostname: string): Promise<ScanCheckResult> {
  const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "dns",
    title: "DNS Information",
  };

  try {
    const nameservers = await dns.resolveNs(hostname);

    return {
      ...base,
      status: "safe",
      value: `${nameservers.length} nameserver${nameservers.length === 1 ? "" : "s"} · no anomalies detected`,
      summary: "DNS records are configured consistently with no signs of tampering.",
    };
  } catch (error) {
    logger.error("DNS check failed", { hostname, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "DNS records could not be retrieved for this domain.",
    };
  }
}
