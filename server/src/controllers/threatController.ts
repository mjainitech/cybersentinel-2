import type { Request, Response } from "express";
import { logger } from "../services/logger";
import { TTLCache } from "../services/cache";
import { THREAT_ENTRIES } from "../data/threatContent";
import { getRecentCves, getCveById, searchCves, countRecentCriticalCves } from "../services/nvdApiClient";
import { filterThreatEntries, sortThreatEntries } from "../utils/threatListUtils";
import { buildThreatOverview } from "../utils/threatOverview";
import { getThreatAiExplanation } from "../services/threatAiExplanation";
import { getRecommendationsForCategory } from "../utils/threatRecommendations";
import {
  addBookmark,
  removeBookmark,
  listBookmarksForUser,
  isBookmarked,
  countBookmarksForUser,
} from "../services/threatBookmarkStore";
import { recordView, listHistoryForUser, clearHistoryForUser, countViewedForUser } from "../services/threatHistoryStore";
import type { ThreatCategory, ThreatSeverity, ThreatListItem, CveRecord } from "../types";

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

// Cache the expensive/rate-limited NVD calls — never hit it on every render.
const recentCveCache = new TTLCache<{ records: CveRecord[] }>(15 * 60 * 1000);
const criticalCountCache = new TTLCache<number | null>(15 * 60 * 1000);
let lastSuccessfulNvdFetch: string | null = null;

function findCuratedById(id: string) {
  return THREAT_ENTRIES.find((e) => e.id === id);
}

export async function getOverview(_req: Request, res: Response) {
  try {
    let criticalCount = criticalCountCache.get("critical-30d")?.value ?? null;
    if (criticalCount === null) {
      criticalCount = await countRecentCriticalCves(30);
      criticalCountCache.set("critical-30d", criticalCount);
      if (criticalCount !== null) lastSuccessfulNvdFetch = new Date().toISOString();
    }

    const overview = buildThreatOverview(THREAT_ENTRIES, criticalCount, lastSuccessfulNvdFetch);
    return res.json({ overview });
  } catch (error) {
    logger.error("Failed to build threat overview", { error: String(error) });
    return res.status(500).json({ error: "Threat overview data is temporarily unavailable." });
  }
}

export async function listThreats(req: Request, res: Response) {
  try {
    const { search, category, severity, sortBy } = req.query;

    const filtered = filterThreatEntries(THREAT_ENTRIES, {
      search: typeof search === "string" ? search : undefined,
      category: typeof category === "string" ? (category as ThreatCategory) : undefined,
      severity: typeof severity === "string" ? (severity as ThreatSeverity) : undefined,
    });

    const sorted = sortThreatEntries(filtered, (sortBy as "newest" | "most-severe" | "recently-updated") ?? "newest");

    return res.json({ threats: sorted });
  } catch (error) {
    logger.error("Failed to list threats", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading threats. Please try again." });
  }
}

export async function listRecentCves(_req: Request, res: Response) {
  try {
    const cacheKey = "recent-cves";
    const cached = recentCveCache.get(cacheKey);
    if (cached) {
      return res.json({ cves: cached.value.records, cached: true });
    }

    const result = await getRecentCves(30, 20);
    if (!result.ok) {
      return res.status(502).json({ error: result.message });
    }

    recentCveCache.set(cacheKey, { records: result.records });
    lastSuccessfulNvdFetch = new Date().toISOString();
    return res.json({ cves: result.records, cached: false });
  } catch (error) {
    logger.error("Failed to list recent CVEs", { error: String(error) });
    return res.status(502).json({ error: "The vulnerability database is temporarily unavailable." });
  }
}

export async function searchCveEndpoint(req: Request, res: Response) {
  const query = req.query.q;
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Please enter a CVE ID, product, or vendor to search." });
  }

  try {
    const result = CVE_ID_PATTERN.test(query.trim()) ? await getCveById(query.trim()) : await searchCves(query.trim());

    if (!result.ok) {
      const statusCode = result.status === "rate-limited" ? 429 : result.status === "not-found" ? 404 : 502;
      return res.status(statusCode).json({ error: result.message });
    }

    return res.json({ cves: result.records });
  } catch (error) {
    logger.error("CVE search failed", { query, error: String(error) });
    return res.status(502).json({ error: "The vulnerability database is temporarily unavailable." });
  }
}

export async function resolveThreatItem(id: string): Promise<ThreatListItem | null> {
  if (CVE_ID_PATTERN.test(id)) {
    const result = await getCveById(id);
    if (!result.ok || result.records.length === 0) return null;
    return { kind: "cve", ...result.records[0] };
  }

  const entry = findCuratedById(id);
  return entry ? { kind: "curated", ...entry } : null;
}

export async function getThreatDetail(req: Request, res: Response) {
  try {
    const item = await resolveThreatItem(req.params.id);
    if (!item) return res.status(404).json({ error: "That threat couldn't be found." });

    const title = item.kind === "curated" ? item.title : item.id;
    const description = item.kind === "curated" ? item.fullDescription : item.description;
    const severity = item.severity;

    const aiExplanation = await getThreatAiExplanation(title, description, severity);
    const recommendations = item.kind === "curated" ? getRecommendationsForCategory(item.category) : [];

    let bookmarked = false;
    if (req.userId) {
      bookmarked = await isBookmarked(req.userId, item.id, item.kind);
      try {
        await recordView(req.userId, {
          threatId: item.id,
          threatKind: item.kind,
          title,
        });
      } catch (error) {
        logger.error("Failed to record threat view", { error: String(error) });
      }
    }

    return res.json({ item, aiExplanation, recommendations, isBookmarked: bookmarked });
  } catch (error) {
    logger.error("Failed to load threat detail", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that threat. Please try again." });
  }
}

export async function bookmarkThreat(req: Request, res: Response) {
  try {
    const item = await resolveThreatItem(req.params.id);
    if (!item) return res.status(404).json({ error: "That threat couldn't be found." });

    const title = item.kind === "curated" ? item.title : item.id;
    const category = item.kind === "curated" ? item.category : "vulnerabilities";

    const record = await addBookmark(req.userId!, { threatId: item.id, threatKind: item.kind, title, category });
    return res.json({ bookmark: record });
  } catch (error) {
    logger.error("Failed to bookmark threat", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong saving that bookmark." });
  }
}

export async function unbookmarkThreat(req: Request, res: Response) {
  try {
    const kind = CVE_ID_PATTERN.test(req.params.id) ? "cve" : "curated";
    const removed = await removeBookmark(req.userId!, req.params.id, kind);
    if (!removed) return res.status(404).json({ error: "That bookmark couldn't be found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to remove bookmark", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong removing that bookmark." });
  }
}

export async function listBookmarks(req: Request, res: Response) {
  try {
    const bookmarks = await listBookmarksForUser(req.userId!);
    return res.json({ bookmarks });
  } catch (error) {
    logger.error("Failed to list bookmarks", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your bookmarks." });
  }
}

export async function listHistory(req: Request, res: Response) {
  try {
    const history = await listHistoryForUser(req.userId!);
    return res.json({ history });
  } catch (error) {
    logger.error("Failed to list threat history", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your history." });
  }
}

export async function clearHistory(req: Request, res: Response) {
  try {
    await clearHistoryForUser(req.userId!);
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to clear threat history", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong clearing your history." });
  }
}

/** Used by the Security Center — informational only, never a scored category (spec explicitly disallows treating this as proof of security). */
export async function getThreatEngagementStats(userId: string) {
  const [threatsViewed, threatsBookmarked] = await Promise.all([countViewedForUser(userId), countBookmarksForUser(userId)]);
  return { threatsViewed, threatsBookmarked };
}
