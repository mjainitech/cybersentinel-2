import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import {
  checkBreach,
  listBreachReports,
  getBreachReport,
  deleteBreachReport,
  toggleActionItem,
} from "../controllers/breachController";

export const breachRouter = Router();

// Rate-limited on top of respecting HIBP's own limits server-side —
// this protects our backend from being hammered regardless of upstream.
const breachCheckLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: "You've checked several emails recently. Please wait a few minutes before checking another.",
});

breachRouter.post("/check", attachUserIfPresent, breachCheckLimiter, checkBreach);

breachRouter.get("/reports", requireAuth, listBreachReports);
breachRouter.get("/reports/:id", requireAuth, getBreachReport);
breachRouter.delete("/reports/:id", requireAuth, deleteBreachReport);
breachRouter.patch("/reports/:id/actions/:actionId", requireAuth, toggleActionItem);
