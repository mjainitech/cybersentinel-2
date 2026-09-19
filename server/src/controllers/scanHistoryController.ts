import type { Request, Response } from "express";
import { logger } from "../services/logger";
import {
  listScansForUser,
  getScanForUser,
  deleteScanForUser,
  toggleFavoriteForUser,
  getStatsForUser,
} from "../services/scanHistoryStore";

export async function listScans(req: Request, res: Response) {
  try {
    const { search, sortBy, sortDir, band, favoriteOnly } = req.query;

    const scans = await listScansForUser(req.userId!, {
      search: typeof search === "string" ? search : undefined,
      sortBy: sortBy === "score" ? "score" : "date",
      sortDir: sortDir === "asc" ? "asc" : "desc",
      band: band === "safe" || band === "warning" || band === "danger" ? band : undefined,
      favoriteOnly: favoriteOnly === "true",
    });

    return res.json({ scans });
  } catch (error) {
    logger.error("Failed to list scan history", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your scan history." });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await getStatsForUser(req.userId!);
    return res.json({ stats });
  } catch (error) {
    logger.error("Failed to load scan history stats", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your scan statistics." });
  }
}

export async function toggleFavorite(req: Request, res: Response) {
  try {
    const favorite = await toggleFavoriteForUser(req.userId!, req.params.id);
    if (favorite === undefined) {
      return res.status(404).json({ error: "That scan couldn't be found." });
    }
    return res.json({ favorite });
  } catch (error) {
    logger.error("Failed to toggle favorite", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong updating that scan." });
  }
}

export async function getScan(req: Request, res: Response) {
  try {
    const scan = await getScanForUser(req.userId!, req.params.id);
    if (!scan) {
      return res.status(404).json({ error: "That scan couldn't be found." });
    }
    return res.json({ scan });
  } catch (error) {
    logger.error("Failed to load scan", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that scan." });
  }
}

export async function deleteScan(req: Request, res: Response) {
  try {
    const deleted = await deleteScanForUser(req.userId!, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "That scan couldn't be found." });
    }
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete scan", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong deleting that scan." });
  }
}
