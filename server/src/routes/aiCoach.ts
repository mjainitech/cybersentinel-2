import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { sendMessage, trackLessonOpened, trackToolOpened, getUsage } from "../controllers/aiCoachController";

export const aiCoachRouter = Router();

// Every endpoint requires auth — context is built strictly from
// req.userId, never a client-supplied id.
aiCoachRouter.use(requireAuth);

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "You've sent a lot of messages in a short time. Please wait a moment before continuing.",
});

aiCoachRouter.post("/message", messageLimiter, sendMessage);
aiCoachRouter.post("/track/lesson-opened", trackLessonOpened);
aiCoachRouter.post("/track/tool-opened", trackToolOpened);
aiCoachRouter.get("/usage", getUsage);
