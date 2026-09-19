import { Router } from "express";
import { scanWebsite } from "../controllers/scanController";
import { attachUserIfPresent } from "../middleware/auth";

export const scanRouter = Router();

scanRouter.post("/scan", attachUserIfPresent, scanWebsite);
