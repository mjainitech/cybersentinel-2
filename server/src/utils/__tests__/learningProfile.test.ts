import { describe, it, expect } from "vitest";
import { buildLearningProfile } from "../learningProfile";
import { EMPTY_STREAK } from "../learningStreak";
import type { LessonProgress } from "../../types";

describe("buildLearningProfile", () => {
  it("reports zero completion and level 1 for a brand-new user", () => {
    const profile = buildLearningProfile(0, [], [], EMPTY_STREAK);
    expect(profile.lessonsCompleted).toBe(0);
    expect(profile.completionPercent).toBe(0);
    expect(profile.level).toBe(1);
  });

  it("computes completionPercent from real completed lessons over total available lessons", () => {
    const progress: LessonProgress[] = [
      { lessonId: "what-is-cybersecurity", status: "completed", quizAttempts: 0 },
      { lessonId: "cia-triad", status: "completed", quizAttempts: 0 },
    ];
    const profile = buildLearningProfile(0, progress, [], EMPTY_STREAK);
    expect(profile.lessonsCompleted).toBe(2);
    expect(profile.completionPercent).toBeGreaterThan(0);
    expect(profile.completionPercent).toBeLessThanOrEqual(100);
  });

  it("reflects the correct level for the given total XP", () => {
    const profile = buildLearningProfile(400, [], [], EMPTY_STREAK);
    expect(profile.level).toBe(3);
    expect(profile.levelTitle).toBe("Cyber Defender");
  });

  it("counts quizzesCompleted as distinct lessons attempted, not total attempts", () => {
    const profile = buildLearningProfile(
      0,
      [],
      [
        {
          lessonId: "what-is-cybersecurity",
          attemptedAt: "t1",
          correctCount: 1,
          totalCount: 2,
          scorePercent: 50,
          isNewBest: true,
          results: [],
        },
        {
          lessonId: "what-is-cybersecurity",
          attemptedAt: "t2",
          correctCount: 2,
          totalCount: 2,
          scorePercent: 100,
          isNewBest: true,
          results: [],
        },
      ],
      EMPTY_STREAK
    );
    expect(profile.quizzesCompleted).toBe(1);
  });

  it("includes per-category progress for every category, even ones with zero completion", () => {
    const profile = buildLearningProfile(0, [], [], EMPTY_STREAK);
    expect(profile.categoryProgress.length).toBe(7);
    expect(profile.categoryProgress.every((c) => c.completed === 0)).toBe(true);
  });
});
