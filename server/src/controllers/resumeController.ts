import type { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";
import { extractResumeText } from "../services/pdfTextExtraction";
import { sanitizeExtractedText } from "../utils/sanitizeText";
import { detectPii } from "../services/piiDetection";
import { calculatePrivacyScore, getPrivacyRating } from "../utils/privacyScore";
import { generateResumeRecommendations } from "../utils/resumeRecommendations";
import { getResumeAiReview } from "../services/resumeAiReview";
import { generateResumeReportPdf } from "../services/resumePdfExport";
import {
  saveResumeReportForUser,
  listResumeReportsForUser,
  getResumeReportForUser,
  deleteResumeReportForUser,
} from "../services/resumeHistoryStore";
import type { ResumePrivacyReport } from "../types";

export async function analyzeResume(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: "Please choose a PDF resume to analyze." });
  }

  try {
    const extraction = await extractResumeText(req.file.buffer);

    if (!extraction.ok) {
      // A failed extraction is a normal, expected outcome (corrupt/password-protected
      // PDF) — respond with a friendly 422, not a 500. The frontend offers a retry.
      return res.status(422).json({ error: extraction.error });
    }

    const text = sanitizeExtractedText(extraction.text);
    const detected = detectPii(text);
    const privacyScore = calculatePrivacyScore(detected);
    const privacyRating = getPrivacyRating(privacyScore);
    const recommendations = generateResumeRecommendations(detected);

    // Only category labels are sent to the AI — never the raw resume text.
    const aiReview = await getResumeAiReview(privacyScore, privacyRating, detected);

    const report: ResumePrivacyReport = {
      fileName: req.file.originalname,
      analyzedAt: new Date().toISOString(),
      privacyScore,
      privacyRating,
      detected,
      recommendations,
      aiReview,
      lowTextWarning: extraction.lowText,
    };

    let savedId: string | undefined;
    if (req.userId) {
      try {
        const record = await saveResumeReportForUser(req.userId, report);
        savedId = record.id;
      } catch (error) {
        // Saving is best-effort — the person still gets their report even if persistence fails.
        logger.error("Failed to save resume report", { userId: req.userId, error: String(error) });
      }
    }

    return res.json({ report, savedId });
  } catch (error) {
    logger.error("Unexpected error analyzing resume", { error: String(error) });
    return next(error);
  }
}

export async function listResumeReports(req: Request, res: Response) {
  try {
    const { search, sortBy, sortDir } = req.query;
    const reports = await listResumeReportsForUser(req.userId!, {
      search: typeof search === "string" ? search : undefined,
      sortBy: sortBy === "score" ? "score" : "date",
      sortDir: sortDir === "asc" ? "asc" : "desc",
    });
    return res.json({ reports });
  } catch (error) {
    logger.error("Failed to list resume reports", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your resume reports." });
  }
}

export async function getResumeReport(req: Request, res: Response) {
  try {
    const record = await getResumeReportForUser(req.userId!, req.params.id);
    if (!record) {
      return res.status(404).json({ error: "That report couldn't be found." });
    }
    return res.json({ report: record });
  } catch (error) {
    logger.error("Failed to load resume report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that report." });
  }
}

export async function deleteResumeReport(req: Request, res: Response) {
  try {
    const deleted = await deleteResumeReportForUser(req.userId!, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "That report couldn't be found." });
    }
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete resume report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong deleting that report." });
  }
}

export async function exportResumeReport(req: Request, res: Response) {
  try {
    const record = await getResumeReportForUser(req.userId!, req.params.id);
    if (!record) {
      return res.status(404).json({ error: "That report couldn't be found." });
    }

    const pdfBuffer = await generateResumeReportPdf(record.report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="privacy-report-${record.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export resume report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}

/**
 * Exports a PDF directly from a report object in the request body,
 * rather than a saved history record — lets guests (and signed-in
 * users who don't want to save first) export immediately after a
 * scan without requiring persistence.
 */
export async function exportResumeReportDirect(req: Request, res: Response) {
  try {
    const report = req.body?.report as ResumePrivacyReport | undefined;
    if (!report || typeof report.privacyScore !== "number") {
      return res.status(400).json({ error: "No report data was provided to export." });
    }

    const pdfBuffer = await generateResumeReportPdf(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="privacy-report.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export resume report directly", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}
