import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  savePasswordReport,
  listPasswordReports,
  getPasswordReport,
  deletePasswordReport,
  exportPasswordReport,
} from "../controllers/passwordController";

export const passwordRouter = Router();

// Deliberately no analyze endpoint here — analysis happens entirely
// client-side (see src/utils/passwordAnalysis.ts on the frontend).
// Everything below only ever reads or writes an already-computed result.
passwordRouter.use(requireAuth);
passwordRouter.post("/reports", savePasswordReport);
passwordRouter.get("/reports", listPasswordReports);
passwordRouter.get("/reports/:id", getPasswordReport);
passwordRouter.delete("/reports/:id", deletePasswordReport);
passwordRouter.get("/reports/:id/export", exportPasswordReport);
