import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listScans, getScan, deleteScan, toggleFavorite, getStats } from "../controllers/scanHistoryController";

export const scanHistoryRouter = Router();

scanHistoryRouter.use(requireAuth);
scanHistoryRouter.get("/", listScans);
// Must come before "/:id" — otherwise Express would match "stats" as an :id param.
scanHistoryRouter.get("/stats", getStats);
scanHistoryRouter.get("/:id", getScan);
scanHistoryRouter.delete("/:id", deleteScan);
scanHistoryRouter.patch("/:id/favorite", toggleFavorite);
