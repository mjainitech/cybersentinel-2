import type { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";
import { validateEmail } from "../utils/validateEmail";
import { lookupBreaches } from "../services/breachApiClient";
import { calculateExposureRiskScore } from "../utils/exposureRiskScore";
import { buildActionPlan } from "../utils/actionPlan";
import { getBreachAiExplanation } from "../services/breachAiExplanation";
import {
  saveBreachReportForUser,
  listBreachReportsForUser,
  getBreachReportForUser,
  deleteBreachReportForUser,
  toggleActionItemForUser,
} from "../services/breachHistoryStore";
import type { ExposureCategory, BreachCheckReport } from "../types";

const ALL_CATEGORIES: ExposureCategory[] = [
  "email",
  "password",
  "phone",
  "name",
  "location",
  "username",
  "ip-address",
  "other",
];

export async function checkBreach(req: Request, res: Response, next: NextFunction) {
  const validation = validateEmail(req.body?.email);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const lookup = await lookupBreaches(validation.email);

    if (!lookup.ok) {
      const statusCode = lookup.status === "rate-limited" ? 429 : lookup.status === "not-configured" ? 503 : 502;
      return res.status(statusCode).json({ error: lookup.message });
    }

    const { breaches } = lookup;
    const riskScore = calculateExposureRiskScore(breaches);
    const categoriesFound = Array.from(new Set(breaches.flatMap((b) => b.exposedCategories)));
    const categoriesNotFound = ALL_CATEGORIES.filter((c) => !categoriesFound.includes(c));
    const actionPlan = buildActionPlan(breaches);
    const aiExplanation = await getBreachAiExplanation(breaches, riskScore.level);

    const report: BreachCheckReport = {
      checkedAt: new Date().toISOString(),
      breachFound: breaches.length > 0,
      breaches,
      categoriesFound,
      categoriesNotFound,
      riskScore,
      aiExplanation,
      actionPlan,
      passwordsPotentiallyExposed: breaches.some((b) => b.isPasswordExposed),
    };

    let savedId: string | undefined;
    if (req.userId) {
      try {
        const record = await saveBreachReportForUser(req.userId, validation.email, report);
        savedId = record.id;
      } catch (error) {
        logger.error("Failed to save breach report", { userId: req.userId, error: String(error) });
      }
    }

    return res.json({ report, savedId });
  } catch (error) {
    logger.error("Unexpected error checking breach", { error: String(error) });
    return next(error);
  }
}

export async function listBreachReports(req: Request, res: Response) {
  try {
    const { search, sortBy, sortDir } = req.query;
    const reports = await listBreachReportsForUser(req.userId!, {
      search: typeof search === "string" ? search : undefined,
      sortBy: sortBy === "risk" ? "risk" : "date",
      sortDir: sortDir === "asc" ? "asc" : "desc",
    });
    return res.json({ reports });
  } catch (error) {
    logger.error("Failed to list breach reports", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading your reports." });
  }
}

export async function getBreachReport(req: Request, res: Response) {
  try {
    const record = await getBreachReportForUser(req.userId!, req.params.id);
    if (!record) return res.status(404).json({ error: "That report couldn't be found." });
    return res.json({ report: record });
  } catch (error) {
    logger.error("Failed to load breach report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that report." });
  }
}

export async function deleteBreachReport(req: Request, res: Response) {
  try {
    const deleted = await deleteBreachReportForUser(req.userId!, req.params.id);
    if (!deleted) return res.status(404).json({ error: "That report couldn't be found." });
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete breach report", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong deleting that report." });
  }
}

export async function toggleActionItem(req: Request, res: Response) {
  try {
    const actionPlan = await toggleActionItemForUser(req.userId!, req.params.id, req.params.actionId);
    if (!actionPlan) return res.status(404).json({ error: "That report or action item couldn't be found." });
    return res.json({ actionPlan });
  } catch (error) {
    logger.error("Failed to toggle action item", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong updating that item." });
  }
}
