import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../middleware/auth";
import { uploadEmailInputs } from "../middleware/uploadEmailInputs";
import {
  analyzeEmail,
  listEmailReports,
  getEmailReport,
  deleteEmailReport,
  exportEmailReport,
  exportEmailReportDirect,
} from "../controllers/emailController";

export const emailRouter = Router();

// Analyzing and direct export work for guests too — only saving to history requires an account.
emailRouter.post("/analyze", attachUserIfPresent, uploadEmailInputs, analyzeEmail);
emailRouter.post("/export", attachUserIfPresent, exportEmailReportDirect);

emailRouter.get("/reports", requireAuth, listEmailReports);
emailRouter.get("/reports/:id", requireAuth, getEmailReport);
emailRouter.delete("/reports/:id", requireAuth, deleteEmailReport);
emailRouter.get("/reports/:id/export", requireAuth, exportEmailReport);
