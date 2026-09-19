import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../middleware/auth";
import { uploadResume } from "../middleware/uploadResume";
import {
  analyzeResume,
  listResumeReports,
  getResumeReport,
  deleteResumeReport,
  exportResumeReport,
  exportResumeReportDirect,
} from "../controllers/resumeController";

export const resumeRouter = Router();

// Analyzing and direct export work for guests too — only saving to history requires an account.
resumeRouter.post("/analyze", attachUserIfPresent, uploadResume, analyzeResume);
resumeRouter.post("/export", attachUserIfPresent, exportResumeReportDirect);

resumeRouter.get("/reports", requireAuth, listResumeReports);
resumeRouter.get("/reports/:id", requireAuth, getResumeReport);
resumeRouter.delete("/reports/:id", requireAuth, deleteResumeReport);
resumeRouter.get("/reports/:id/export", requireAuth, exportResumeReport);
