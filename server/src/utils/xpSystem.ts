import type { LearningLevel } from "../types";

/**
 * These are CyberSentinel learning levels — an internal progress
 * indicator, not a professional certification of any kind. The UI
 * labels them accordingly.
 */
export const LEARNING_LEVELS: LearningLevel[] = [
  { level: 1, title: "Cybersecurity Beginner", xpRequired: 0 },
  { level: 2, title: "Security Explorer", xpRequired: 150 },
  { level: 3, title: "Cyber Defender", xpRequired: 400 },
  { level: 4, title: "Security Analyst", xpRequired: 800 },
  { level: 5, title: "CyberSentinel Scholar", xpRequired: 1400 },
];

/** XP awarded server-side for each kind of action — never accepted from the client, to prevent tampering. */
export const XP_REWARDS = {
  LESSON_COMPLETE: 20,
  QUIZ_COMPLETE: 10,
  QUIZ_CORRECT_ANSWER: 5,
  CATEGORY_COMPLETE: 50,
  STREAK_DAY: 5,
};

export interface LevelInfo {
  level: number;
  levelTitle: string;
  xpForNextLevel: number | null;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number | null;
}

export function calculateLevel(totalXp: number): LevelInfo {
  let current = LEARNING_LEVELS[0];
  let next: LearningLevel | undefined;

  for (let i = 0; i < LEARNING_LEVELS.length; i++) {
    if (totalXp >= LEARNING_LEVELS[i].xpRequired) {
      current = LEARNING_LEVELS[i];
      next = LEARNING_LEVELS[i + 1];
    }
  }

  return {
    level: current.level,
    levelTitle: current.title,
    xpForNextLevel: next ? next.xpRequired : null,
    xpIntoCurrentLevel: totalXp - current.xpRequired,
    xpNeededForNextLevel: next ? next.xpRequired - current.xpRequired : null,
  };
}
