import type { LearningAchievement, LessonProgress, QuizAttemptResult, LearningCategoryId } from "../types";
import { getCategoriesWithCounts, getLessonsByCategory } from "../data/learningContent";

export interface AchievementContext {
  progress: LessonProgress[];
  quizAttempts: QuizAttemptResult[];
  longestStreak: number;
}

function categoryFullyCompleted(categoryId: LearningCategoryId, progress: LessonProgress[]): boolean {
  const lessons = getLessonsByCategory(categoryId).filter((lesson) => lesson.isAvailable);
  if (lessons.length === 0) return false;
  return lessons.every((lesson) => progress.some((p) => p.lessonId === lesson.id && p.status === "completed"));
}

export function calculateLearningAchievements(context: AchievementContext): LearningAchievement[] {
  const completedCount = context.progress.filter((p) => p.status === "completed").length;
  const totalAvailable = getCategoriesWithCounts().reduce((sum, c) => sum + c.availableLessonCount, 0);
  const hasPerfectQuiz = context.quizAttempts.some((a) => a.scorePercent === 100);

  return [
    {
      id: "first-lesson",
      title: "First Lesson",
      description: "Complete your first lesson in the Learning Hub.",
      unlocked: completedCount >= 1,
    },
    {
      id: "first-quiz",
      title: "First Quiz",
      description: "Complete your first lesson quiz.",
      unlocked: context.quizAttempts.length >= 1,
    },
    {
      id: "cybersecurity-beginner",
      title: "Cybersecurity Beginner",
      description: "Complete every available lesson in Cybersecurity Fundamentals.",
      unlocked: categoryFullyCompleted("fundamentals", context.progress),
    },
    {
      id: "password-defender",
      title: "Password Defender",
      description: "Complete every available lesson in Online Safety.",
      unlocked: categoryFullyCompleted("online-safety", context.progress),
    },
    {
      id: "phishing-student",
      title: "Phishing Student",
      description: "Complete every available lesson in Phishing & Social Engineering.",
      unlocked: categoryFullyCompleted("phishing-social-engineering", context.progress),
    },
    {
      id: "web-security-explorer",
      title: "Web Security Explorer",
      description: "Complete every available lesson in Web Security.",
      unlocked: categoryFullyCompleted("web-security", context.progress),
    },
    {
      id: "malware-basics",
      title: "Malware Basics",
      description: "Complete every available lesson in Malware.",
      unlocked: categoryFullyCompleted("malware", context.progress),
    },
    {
      id: "privacy-protector",
      title: "Privacy Protector",
      description: "Complete every available lesson in Privacy.",
      unlocked: categoryFullyCompleted("privacy", context.progress),
    },
    {
      id: "perfect-quiz",
      title: "Perfect Quiz",
      description: "Score 100% on a lesson quiz.",
      unlocked: hasPerfectQuiz,
    },
    {
      id: "learning-streak",
      title: "Learning Streak",
      description: "Reach a 3-day learning streak.",
      unlocked: context.longestStreak >= 3,
    },
    {
      id: "course-completed",
      title: "Course Completed",
      description: "Complete every available lesson in the Learning Hub.",
      unlocked: totalAvailable > 0 && completedCount >= totalAvailable,
    },
  ];
}
