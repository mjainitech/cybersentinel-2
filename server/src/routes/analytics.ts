import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getAnalyticsDashboard, compareAnalyticsPeriods, generateReport, exportReportPdf } from "../controllers/analyticsController";

export const analyticsRouter = Router();

// Every analytics endpoint requires auth and is scoped to req.userId
// from the authenticated session — never a client-supplied user id.
analyticsRouter.use(requireAuth);
analyticsRouter.get("/", getAnalyticsDashboard);
analyticsRouter.get("/compare", compareAnalyticsPeriods);
analyticsRouter.post("/report", generateReport);
analyticsRouter.get("/report/export", exportReportPdf);
