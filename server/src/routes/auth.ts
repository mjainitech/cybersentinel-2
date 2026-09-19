import { Router } from "express";
import { register, login, me, forgotPassword, resetPassword } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

// Rate-limited specifically — these two are unauthenticated and could
// otherwise be used to spam a target's inbox or brute-force tokens.
authRouter.post(
  "/forgot-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: "Too many reset requests. Please wait a while before trying again." }),
  forgotPassword
);
authRouter.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many attempts. Please wait a while before trying again." }),
  resetPassword
);
