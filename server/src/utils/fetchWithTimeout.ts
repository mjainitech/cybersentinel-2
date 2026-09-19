import { env } from "../config/env";

/**
 * fetch() with an enforced timeout. Every external API call in this
 * project goes through this so a single slow provider can't hang the
 * whole /api/scan request — it just times out and that check reports
 * as "unknown" instead.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = env.REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
