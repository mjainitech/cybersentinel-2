import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import {
  getOverview,
  listThreats,
  listRecentCves,
  searchCveEndpoint,
  getThreatDetail,
  bookmarkThreat,
  unbookmarkThreat,
  listBookmarks,
  listHistory,
  clearHistory,
} from "../controllers/threatController";

export const threatsRouter = Router();

// Search hits the live NVD API — rate-limited on our side too, on top of NVD's own limits.
const cveSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many vulnerability searches right now. Please wait a moment and try again.",
});

// Threat content and CVE data are publicly readable — optional auth just
// includes the calling user's own bookmark state and records history.
threatsRouter.get("/overview", getOverview);
threatsRouter.get("/", listThreats);
threatsRouter.get("/cves", listRecentCves);
threatsRouter.get("/cves/search", cveSearchLimiter, searchCveEndpoint);
threatsRouter.get("/bookmarks", requireAuth, listBookmarks);
threatsRouter.get("/history", requireAuth, listHistory);
threatsRouter.delete("/history", requireAuth, clearHistory);
threatsRouter.get("/:id", attachUserIfPresent, getThreatDetail);
threatsRouter.post("/:id/bookmark", requireAuth, bookmarkThreat);
threatsRouter.delete("/:id/bookmark", requireAuth, unbookmarkThreat);
