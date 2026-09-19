import { describe, it, expect } from "vitest";
import { calculateLearningAchievements } from "../learningAchievements";
import type { LessonProgress, QuizAttemptResult } from "../../types";

const NO_PROGRESS: LessonProgress[] = [];
const NO_ATTEMPTS: QuizAttemptResult[] = [];

function completed(lessonId: string): LessonProgress {
  return { lessonId, status: "completed", completedAt: new Date().toISOString(), quizAttempts: 0 };
}

describe("calculateLearningAchievements", () => {
  it("locks every achievement with no activity", () => {
    const achievements = calculateLearningAchievements({ progress: NO_PROGRESS, quizAttempts: NO_ATTEMPTS, longestStreak: 0 });
    expect(achievements.every((a) => !a.unlocked)).toBe(true);
  });

  it("unlocks 'First Lesson' after one completed lesson", () => {
    const achievements = calculateLearningAchievements({
      progress: [completed("what-is-cybersecurity")],
      quizAttempts: NO_ATTEMPTS,
      longestStreak: 0,
    });
    expect(achievements.find((a) => a.id === "first-lesson")?.unlocked).toBe(true);
  });

  it("unlocks 'First Quiz' only after a real quiz attempt, not just a completed lesson", () => {
    const withLessonOnly = calculateLearningAchievements({
      progress: [completed("what-is-cybersecurity")],
      quizAttempts: NO_ATTEMPTS,
      longestStreak: 0,
    });
    expect(withLessonOnly.find((a) => a.id === "first-quiz")?.unlocked).toBe(false);

    const withQuiz = calculateLearningAchievements({
      progress: [completed("what-is-cybersecurity")],
      quizAttempts: [
        {
          lessonId: "what-is-cybersecurity",
          attemptedAt: new Date().toISOString(),
          correctCount: 1,
          totalCount: 2,
          scorePercent: 50,
          isNewBest: true,
          results: [],
        },
      ],
      longestStreak: 0,
    });
    expect(withQuiz.find((a) => a.id === "first-quiz")?.unlocked).toBe(true);
  });

  it("unlocks 'Cybersecurity Beginner' only once every available fundamentals lesson is completed", () => {
    const partial = calculateLearningAchievements({
      progress: [completed("what-is-cybersecurity")],
      quizAttempts: NO_ATTEMPTS,
      longestStreak: 0,
    });
    expect(partial.find((a) => a.id === "cybersecurity-beginner")?.unlocked).toBe(false);

    const full = calculateLearningAchievements({
      progress: [completed("what-is-cybersecurity"), completed("cia-triad")],
      quizAttempts: NO_ATTEMPTS,
      longestStreak: 0,
    });
    expect(full.find((a) => a.id === "cybersecurity-beginner")?.unlocked).toBe(true);
  });

  it("unlocks 'Perfect Quiz' only when a quiz attempt actually scored 100%", () => {
    const notPerfect = calculateLearningAchievements({
      progress: NO_PROGRESS,
      quizAttempts: [
        { lessonId: "x", attemptedAt: "now", correctCount: 1, totalCount: 2, scorePercent: 50, isNewBest: true, results: [] },
      ],
      longestStreak: 0,
    });
    expect(notPerfect.find((a) => a.id === "perfect-quiz")?.unlocked).toBe(false);

    const perfect = calculateLearningAchievements({
      progress: NO_PROGRESS,
      quizAttempts: [
        { lessonId: "x", attemptedAt: "now", correctCount: 2, totalCount: 2, scorePercent: 100, isNewBest: true, results: [] },
      ],
      longestStreak: 0,
    });
    expect(perfect.find((a) => a.id === "perfect-quiz")?.unlocked).toBe(true);
  });

  it("unlocks 'Learning Streak' at a 3-day longest streak, not before", () => {
    const twoDay = calculateLearningAchievements({ progress: NO_PROGRESS, quizAttempts: NO_ATTEMPTS, longestStreak: 2 });
    expect(twoDay.find((a) => a.id === "learning-streak")?.unlocked).toBe(false);

    const threeDay = calculateLearningAchievements({ progress: NO_PROGRESS, quizAttempts: NO_ATTEMPTS, longestStreak: 3 });
    expect(threeDay.find((a) => a.id === "learning-streak")?.unlocked).toBe(true);
  });

  it("never unlocks an achievement from an empty progress state — nothing is granted just for visiting a page", () => {
    const achievements = calculateLearningAchievements({ progress: NO_PROGRESS, quizAttempts: NO_ATTEMPTS, longestStreak: 0 });
    expect(achievements.filter((a) => a.unlocked)).toHaveLength(0);
  });
});
