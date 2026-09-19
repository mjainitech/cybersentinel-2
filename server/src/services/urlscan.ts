import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { ScanCheckResult } from "../types";

const URLSCAN_BASE = "https://urlscan.io/api/v1";

/**
 * Checks URLScan.io's public search index for an existing scan of
 * this URL. We deliberately search rather than submit-and-wait: a
 * fresh URLScan analysis takes 10–30+ seconds to complete, which is
 * too slow for a single request/response cycle. If nothing is found,
 * we submit the URL so a result exists for a future scan.
 */
export async function getUrlscanCheck(url: string): Promise<ScanCheckResult> {
  const base: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "community-verdict",
    title: "Community Scan Verdict",
  };

  if (!env.URLSCAN_API_KEY) {
    return {
      ...base,
      status: "unknown",
      value: "Not configured",
      summary: "URLScan check unavailable — no API key configured on the server.",
    };
  }

  try {
    const query = `page.url:"${url}"`;
    const searchRes = await fetchWithTimeout(
      `${URLSCAN_BASE}/search/?q=${encodeURIComponent(query)}`,
      { headers: { "API-Key": env.URLSCAN_API_KEY } }
    );

    if (!searchRes.ok) {
      throw new Error(`URLScan search responded with ${searchRes.status}`);
    }

    const searchPayload = await searchRes.json();
    const topResult = searchPayload?.results?.[0];

    if (!topResult) {
      await submitScan(url).catch((error) =>
        logger.error("URLScan submission failed", { url, error: String(error) })
      );
      return {
        ...base,
        status: "unknown",
        value: "Not yet scanned",
        summary: "No prior URLScan record found — a scan has been submitted for next time.",
      };
    }

    const resultRes = await fetchWithTimeout(`${URLSCAN_BASE}/result/${topResult._id}/`);
    if (!resultRes.ok) {
      throw new Error(`URLScan result responded with ${resultRes.status}`);
    }

    const resultPayload = await resultRes.json();
    const malicious = Boolean(resultPayload?.verdicts?.overall?.malicious);
    const score = Number(resultPayload?.verdicts?.overall?.score ?? 0);

    const status = malicious ? "danger" : score > 0 ? "warning" : "safe";
    const summary = malicious
      ? "URLScan's community verdict flags this page as malicious."
      : score > 0
      ? "URLScan found some suspicious signals on this page, though not enough to call it malicious."
      : "URLScan's community verdict found no malicious signals on this page.";

    return {
      ...base,
      status,
      value: malicious ? "Malicious" : score > 0 ? `Score: ${score}` : "Clean",
      summary,
    };
  } catch (error) {
    logger.error("URLScan check failed", { url, error: String(error) });
    return {
      ...base,
      status: "unknown",
      value: "Unavailable",
      summary: "URLScan check failed — result temporarily unavailable.",
    };
  }
}

async function submitScan(url: string): Promise<void> {
  await fetchWithTimeout(`${URLSCAN_BASE}/scan/`, {
    method: "POST",
    headers: {
      "API-Key": env.URLSCAN_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url, visibility: "unlisted" }),
  });
}
