import type { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";
import { extractTextFromScreenshot } from "../services/screenshotOcr";
import { sanitizeExtractedText } from "../utils/sanitizeText";
import { extractLinks, detectEmailIndicators, detectAttachmentRisk } from "../services/emailIndicators";
import { calculateEmailRiskScore, getEmailClassification } from "../utils/emailRiskScore";
import { getEmailAiExplanation } from "../services/emailAiExplanation";
import { generateEmailReportPdf } from "../services/emailPdfExport";
import {
  saveEmailReportForUser,
  listEmailReportsForUser,
  getEmailReportForUser,
  deleteEmailReportForUser,
} from "../services/emailHistoryStore";
import type { EmailAnalysisReport, EmailAttachmentInfo } from "../types";

const MAX_EMAIL_TEXT_LENGTH = 20_000;

function buildAttachmentInfo(file: Express.Multer.File | undefined): EmailAttachmentInfo | undefined {
  if (!file) return undefined;

  return {
    filename: file.originalname,
    fileType: file.mimetype || "unknown",
    fileSize: file.size,
    riskIndicators: detectAttachmentRisk(file.originalname),
  };
}

export async function analyzeEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as unknown as { screenshot?: Express.Multer.File[]; attachment?: Express.Multer.File[] } | undefined;
    const screenshotFile = files?.screenshot?.[0];
    const attachmentFile = files?.attachment?.[0];

    const inputMethod = req.body?.inputMethod === "headers" ? "headers" : screenshotFile ? "screenshot" : "text";
    let rawText = typeof req.body?.content === "string" ? req.body.content : "";
    let lowTextWarning = false;

    if (inputMethod === "screenshot") {
      if (!screenshotFile) {
        return res.status(400).json({ error: "Please upload a screenshot to analyze." });
      }
      const ocr = await extractTextFromScreenshot(screenshotFile.buffer);
      if (!ocr.ok) {
        return res.status(422).json({ error: ocr.error });
      }
      rawText = ocr.text;
      lowTextWarning = ocr.lowText;
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: "Please provide some email content to analyze." });
    }

    const text = sanitizeExtractedText(rawText).slice(0, MAX_EMAIL_TEXT_LENGTH);

    const links = extractLinks(text);
    const attachment = buildAttachmentInfo(attachmentFile);

    const indicators = [
      ...detectEmailIndicators(text, links),
      ...(attachment && attachment.riskIndicators.some((r) => r.includes("executable") || r.includes("double extension"))
        ? [
            {
              category: "suspicious-attachment" as const,
              label: "Suspicious Attachment",
              explanation: attachment.riskIndicators[0],
              severity: "high" as const,
            },
          ]
        : []),
    ];

    const riskScore = calculateEmailRiskScore(indicators);
    const classification = getEmailClassification(riskScore);
    const aiExplanation = await getEmailAiExplanation(riskScore, classification, indicators);

    const report: EmailAnalysisReport = {
      inputMethod,
      analyzedAt: new Date().toISOString(),
      riskScore,
      classification,
      indicators,
      links,
      attachment,
      aiExplanation,
      analyzedText: text,
      lowTextWarning,
    };

    let savedId: string | undefined;
    if (req.userId) {
      try {
        const record = await saveEmailReportForUser(req.userId, report);
        savedId = record.id;
      } catch (error) {
        logger.error("Failed to save email report", { userId: req.userId, error: String(error) });
      }
    }

    return res.json({ report, savedId });
  } catch (error) {
    logger.error("Unexpected error analyzing email", { error: String(error) });
    return next(error);
  }
}

export async function listEmailReports(req: Request, res: Response) {
  try {
    const { search, sortBy, sortDir } = req.query;
    const reports = await listEmailReportsForUser(req.userId!, {
      search: typeof search === "string" ? search : undefined,
      sortBy: sortBy === "score" ? "score" : "date",
      sortDir: sortDir === "asc" ? "asc" : "desc",
    });
    return res.json({ reports });
  } catch (error) {
    logger.error("Failed to list email reports", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your email reports." });
  }
}

export async function getEmailReport(req: Request, res: Response) {
  try {
    const record = await getEmailReportForUser(req.userId!, req.params.id);
    if (!record) return res.status(404).json({ error: "That report couldn't be found." });
    return res.json({ report: record });
  } catch (error) {
    logger.error("Failed to load email report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that report." });
  }
}

export async function deleteEmailReport(req: Request, res: Response) {
  try {
    const deleted = await deleteEmailReportForUser(req.userId!, req.params.id);
    if (!deleted) return res.status(404).json({ error: "That report couldn't be found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete email report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong deleting that report." });
  }
}

export async function exportEmailReport(req: Request, res: Response) {
  try {
    const record = await getEmailReportForUser(req.userId!, req.params.id);
    if (!record) return res.status(404).json({ error: "That report couldn't be found." });

    const pdfBuffer = await generateEmailReportPdf(record.report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="email-report-${record.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export email report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}

export async function exportEmailReportDirect(req: Request, res: Response) {
  try {
    const report = req.body?.report as EmailAnalysisReport | undefined;
    if (!report || typeof report.riskScore !== "number") {
      return res.status(400).json({ error: "No report data was provided to export." });
    }

    const pdfBuffer = await generateEmailReportPdf(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="email-report.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Failed to export email report directly", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong generating that PDF." });
  }
}
