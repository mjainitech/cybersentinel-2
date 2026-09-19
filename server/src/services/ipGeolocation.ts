import * as dns from "node:dns/promises";
import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
  id: "ip-address",
  title: "Website IP Address",
};

/**
 * Resolves the site's IP address with Node's built-in DNS resolver
 * (no API needed for that part), then looks up its hosting location
 * via an IP geolocation API. If the geolocation call fails, we still
 * report the resolved IP — a partial result rather than a blank one.
 */
export async function getIpAddressCheck(hostname: string): Promise<ScanCheckResult> {
  let ip: string;
  try {
    const result = await dns.lookup(hostname);
    ip = result.address;
  } catch (error) {
    logger.error("DNS lookup failed", { hostname, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "Could not resolve this domain to an IP address.",
    };
  }

  if (!env.IP_GEOLOCATION_API_KEY) {
    return {
      ...base,
      status: "unknown",
      value: ip,
      summary: "Resolved the IP address, but hosting location is unavailable — no API key configured.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${env.IP_GEOLOCATION_API_KEY}&ip=${ip}`
    );

    if (!response.ok) {
      throw new Error(`IP geolocation provider responded with ${response.status}`);
    }

    const payload = await response.json();
    const country = payload?.country_name;
    const countryCode = payload?.country_code2;
    const isp = payload?.isp;

    return {
      ...base,
      status: "safe",
      value: country ? `${ip} · Hosted in ${country}` : ip,
      summary: isp
        ? `Hosted with ${isp}. Hosting location and provider show nothing unusual.`
        : "Hosting location shows nothing unusual.",
      meta: countryCode ? { countryCode, country: country ?? "" } : undefined,
    };
  } catch (error) {
    logger.error("IP geolocation check failed", { hostname, ip, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: ip,
      summary: "Resolved the IP address, but the hosting location lookup failed.",
    };
  }
}
