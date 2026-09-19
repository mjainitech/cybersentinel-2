import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../middleware/auth";
import { getCatalog, getLesson, completeLesson, submitQuiz, getProfile } from "../controllers/learningController";

export const learningRouter = Router();

// Lesson content is publicly readable, per the spec — optional auth
// just lets the response include the calling user's own progress inline.
learningRouter.get("/catalog", attachUserIfPresent, getCatalog);
learningRouter.get("/lessons/:id", attachUserIfPresent, getLesson);

// Everything that writes progress or grades a quiz requires a real, authenticated user.
learningRouter.post("/lessons/:id/complete", requireAuth, completeLesson);
learningRouter.post("/lessons/:id/quiz", requireAuth, submitQuiz);
learningRouter.get("/profile", requireAuth, getProfile);
