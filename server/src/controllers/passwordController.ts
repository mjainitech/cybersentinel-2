import type { Request, Response } from "express";
import { logger } from "../services/logger";
import {
  savePasswordReportForUser,
  listPasswordReportsForUser,
  getPasswordReportForUser,
  deletePasswordReportForUser,
} from "../services/passwordHistoryStore";
import { generatePasswordReportPdf } from "../services/passwordPdfExport";
import type { PasswordChecklistState, PasswordHistoryRecord } from "../types";

const VALID_RATINGS = new Set<PasswordHistoryRecord["rating"]>(["very-weak", "weak", "fair", "strong", "excellent"]);

function isValidRating(value: unknown): value is PasswordHistoryRecord["rating"] {
  return typeof value === "string" && VALID_RATINGS.has(value as PasswordHistoryRecord["rating"]);
}

/**
 * Saves a password analysis *result*. The request body is expected
 * to contain only { score, rating, recommendations, checklist } —
 * all computed client-side. This validates the shape strictly rather
 * than just picking fields off an untrusted body, since a `password`
 * field showing up here should never be silently accepted.
 */
export async function savePasswordReport(req: Request, res: Response) {
  try {
    const { score, rating, recommendations, checklist } = req.body ?? {};

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({ error: "Invalid score." });
    }
    if (!isValidRating(rating)) {
      return res.status(400).json({ error: "Invalid rating." });
    }
    if (!Array.isArray(recommendations) || !recommendations.every((r) => typeof r === "string")) {
      return res.status(400).json({ error: "Invalid recommendations." });
    }
    if (!checklist || typeof checklist !== "object") {
      return res.status(400).json({ error: "Invalid checklist." });
    }

    const record = await savePasswordReportForUser(req.userId!, {
      score,
      rating,
      recommendations,
      checklist: checklist as PasswordChecklistState,
    });

    return res.json({ id: record.id });
  } catch (error) {
    logger.error("Failed to save password report", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong saving that report." });
  }
}

export async function listPasswordReports(req: Request, res: Response) {
  try {
    const { sortBy, sortDir } = req.query;
    const reports = await listPasswordReportsForUser(req.userId!, {
      sortBy: sortBy === "score" ? "score" : "date",
      sortDir: sortDir === "asc" ? "asc" : "desc",
    });
    return res.json({ reports });
  } catch (error) {
    logger.error("Failed to list password reports", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your reports." });
  }
}

export async function getPasswordReport(req: Request, res: Response) {
  try {
    const record = await getPasswordReportForUser(req.userId!, req.params.id);
    if (!record) return res.status(404).json({ error: "That report couldn't be found." });
    return res.json({ report: record });
  } catch (error) {
    logger.error("Failed to load password report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that report." });
  }
}

export async function deletePasswordReport(req: Request, res: Response) {
  try {
    const deleted = await deletePasswordReportForUser(req.userId!, req.params.id);
    if (!deleted) return res.status(404).json({ error: "That report couldn't be found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete password report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong deleting that report." });
  }
}

export async function exportPasswordReport(req: Request, res: Response) {
  try {
    const record = await getPasswordReportForUser(req.userId!, req.params.id);
    if (!record) return res.status(404).json({ error: "That report couldn't be found." });

    const pdfBuffer = await generatePasswordReportPdf(record);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="password-report-${record.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export password report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}
