import { calculateLevel } from "./xpSystem";
import { getCategoriesWithCounts, getLessonsByCategory } from "../data/learningContent";
import { calculateLearningAchievements } from "./learningAchievements";
import type { LearningProfile, LessonProgress, QuizAttemptResult, LearningStreakState } from "../types";

export function buildLearningProfile(
  totalXp: number,
  progress: LessonProgress[],
  quizAttempts: QuizAttemptResult[],
  streak: LearningStreakState
): LearningProfile {
  const levelInfo = calculateLevel(totalXp);
  const categories = getCategoriesWithCounts();

  const lessonsCompleted = progress.filter((p) => p.status === "completed").length;
  const totalAvailableLessons = categories.reduce((sum, c) => sum + c.availableLessonCount, 0);
  const completionPercent = totalAvailableLessons > 0 ? Math.round((lessonsCompleted / totalAvailableLessons) * 100) : 0;
  const quizzesCompleted = new Set(quizAttempts.map((a) => a.lessonId)).size;

  const achievements = calculateLearningAchievements({ progress, quizAttempts, longestStreak: streak.longestStreak });
  const achievementsEarned = achievements.filter((a) => a.unlocked).length;

  const categoryProgress = categories.map((category) => {
    const lessonsInCategory = getLessonsByCategory(category.id).filter((l) => l.isAvailable);
    const completed = lessonsInCategory.filter((l) => progress.some((p) => p.lessonId === l.id && p.status === "completed")).length;
    return { categoryId: category.id, completed, total: lessonsInCategory.length };
  });

  return {
    totalXp,
    level: levelInfo.level,
    levelTitle: levelInfo.levelTitle,
    xpForNextLevel: levelInfo.xpForNextLevel,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    xpNeededForNextLevel: levelInfo.xpNeededForNextLevel,
    lessonsCompleted,
    totalAvailableLessons,
    completionPercent,
    quizzesCompleted,
    achievementsEarned,
    streak,
    categoryProgress,
  };
}
