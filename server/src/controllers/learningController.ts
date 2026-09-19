import type { Request, Response } from "express";
import { logger } from "../services/logger";
import {
  getCategoriesWithCounts,
  getLessonById,
  getAdjacentLessons,
  LESSONS,
} from "../data/learningContent";
import { filterLessons } from "../utils/learningSearch";
import { sanitizeLessonForClient } from "../utils/sanitizeLesson";
import { gradeQuiz } from "../utils/quizGrading";
import {
  markLessonComplete,
  recordQuizAttempt,
  getUserLearningSnapshot,
  getLearningCompletionStats,
} from "../services/learningProgressStore";
import { buildLearningProfile } from "../utils/learningProfile";
import { calculateLearningAchievements } from "../utils/learningAchievements";
import { createNotification } from "../services/notificationStore";
import type { LessonDifficulty, LearningCategoryId } from "../types";

export async function getCatalog(req: Request, res: Response) {
  try {
    const { search, difficulty, category } = req.query;

    const filtered = filterLessons(LESSONS, {
      search: typeof search === "string" ? search : undefined,
      difficulty: typeof difficulty === "string" ? (difficulty as LessonDifficulty) : undefined,
      categoryId: typeof category === "string" ? (category as LearningCategoryId) : undefined,
    });

    const snapshot = req.userId ? await getUserLearningSnapshot(req.userId) : null;

    const lessons = filtered.map((lesson) => {
      const progress = snapshot?.progress.find((p) => p.lessonId === lesson.id);
      return {
        id: lesson.id,
        categoryId: lesson.categoryId,
        title: lesson.title,
        difficulty: lesson.difficulty,
        estimatedMinutes: lesson.estimatedMinutes,
        order: lesson.order,
        isAvailable: lesson.isAvailable,
        status: progress?.status ?? "not-started",
      };
    });

    return res.json({ categories: getCategoriesWithCounts(), lessons });
  } catch (error) {
    logger.error("Failed to load learning catalog", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading the Learning Hub. Please try again." });
  }
}

export async function getLesson(req: Request, res: Response) {
  try {
    const lesson = getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "That lesson couldn't be found." });
    if (!lesson.isAvailable) return res.status(404).json({ error: "This lesson is coming soon." });

    const { previous, next } = getAdjacentLessons(lesson.id);
    const snapshot = req.userId ? await getUserLearningSnapshot(req.userId) : null;
    const progress = snapshot?.progress.find((p) => p.lessonId === lesson.id);

    return res.json({
      lesson: sanitizeLessonForClient(lesson),
      previous: previous ? { id: previous.id, title: previous.title } : null,
      next: next ? { id: next.id, title: next.title } : null,
      status: progress?.status ?? "not-started",
      bestQuizScore: progress?.bestQuizScore ?? null,
    });
  } catch (error) {
    logger.error("Failed to load lesson", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading that lesson. Please try again." });
  }
}

export async function completeLesson(req: Request, res: Response) {
  try {
    const before = await getUserLearningSnapshot(req.userId!).catch(() => null);
    const achievementsBefore = before
      ? calculateLearningAchievements({ progress: before.progress, quizAttempts: before.quizAttempts, longestStreak: before.streak.longestStreak })
      : [];
    const unlockedBefore = new Set(achievementsBefore.filter((a) => a.unlocked).map((a) => a.id));

    const result = await markLessonComplete(req.userId!, req.params.id);

    if (!result.alreadyCompleted) {
      const after = await getUserLearningSnapshot(req.userId!).catch(() => null);
      const achievementsAfter = after
        ? calculateLearningAchievements({ progress: after.progress, quizAttempts: after.quizAttempts, longestStreak: after.streak.longestStreak })
        : [];
      const newlyUnlocked = achievementsAfter.find((a) => a.unlocked && !unlockedBefore.has(a.id));

      // Only notify on a genuine new achievement unlock — a notification
      // for every single lesson completion would be spammy, per the spec.
      if (newlyUnlocked) {
        createNotification(req.userId!, {
          category: "achievement",
          title: "Achievement Unlocked",
          description: `You earned "${newlyUnlocked.title}" — ${newlyUnlocked.description}`,
          relatedPage: "/dashboard/learning-hub",
        }).catch((error) => logger.error("Failed to create achievement notification", { error: String(error) }));
      }
    }

    return res.json(result);
  } catch (error) {
    logger.error("Failed to mark lesson complete", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong saving your progress. Please try again." });
  }
}

export async function submitQuiz(req: Request, res: Response) {
  try {
    const lesson = getLessonById(req.params.id);
    if (!lesson || !lesson.isAvailable) {
      return res.status(404).json({ error: "That lesson's quiz couldn't be found." });
    }

    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== lesson.quiz.length) {
      return res.status(400).json({ error: "Please answer every question before submitting." });
    }

    // Grading happens entirely server-side against the real answer key —
    // the client only ever sends which choice index it picked per question.
    const { correctCount, totalCount, results } = gradeQuiz(lesson, answers);

    const { attempt, xpAwarded } = await recordQuizAttempt(req.userId!, lesson.id, correctCount, totalCount, results);

    return res.json({ attempt, xpAwarded });
  } catch (error) {
    logger.error("Failed to grade quiz", { id: req.params.id, error: String(error) });
    return res.status(500).json({ error: "Something went wrong submitting your quiz. Please try again." });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const snapshot = await getUserLearningSnapshot(req.userId!);
    const profile = buildLearningProfile(snapshot.totalXp, snapshot.progress, snapshot.quizAttempts, snapshot.streak);
    const achievements = calculateLearningAchievements({
      progress: snapshot.progress,
      quizAttempts: snapshot.quizAttempts,
      longestStreak: snapshot.streak.longestStreak,
    });

    return res.json({ profile, achievements });
  } catch (error) {
    logger.error("Failed to build learning profile", { error: String(error) });
    return res.status(500).json({ error: "Some learning information is temporarily unavailable. Please try again." });
  }
}

/** Used by the Security Center's Education category — kept separate from the full profile endpoint since it needs no auth-context UI, just numbers. */
export async function getCompletionStatsForUser(userId: string) {
  return getLearningCompletionStats(userId);
}
