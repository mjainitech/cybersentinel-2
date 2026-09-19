import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getSecurityProfile } from "../controllers/securityCenterController";

export const securityCenterRouter = Router();

securityCenterRouter.use(requireAuth);
securityCenterRouter.get("/profile", getSecurityProfile);
