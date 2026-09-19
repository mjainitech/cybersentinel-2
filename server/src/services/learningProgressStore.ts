import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import { logger } from "./logger";
import { getLessonById, getLessonsByCategory } from "../data/learningContent";
import { XP_REWARDS } from "../utils/xpSystem";
import { recordActivity, getEffectiveStreak, EMPTY_STREAK } from "../utils/learningStreak";
import type {
  LessonProgress,
  QuizAttemptResult,
  XpTransaction,
  LearningStreakState,
} from "../types";

interface UserLearningState {
  userId: string;
  progress: LessonProgress[];
  quizAttempts: QuizAttemptResult[];
  xpTransactions: XpTransaction[];
  streak: LearningStreakState;
}

const store = new JsonFileStore<UserLearningState[]>(
  path.join(__dirname, "..", "..", "data", "learning-progress.json"),
  []
);

function emptyState(userId: string): UserLearningState {
  return { userId, progress: [], quizAttempts: [], xpTransactions: [], streak: { ...EMPTY_STREAK } };
}

async function getOrCreateState(userId: string): Promise<{ all: UserLearningState[]; state: UserLearningState }> {
  const all = await store.read();
  let state = all.find((s) => s.userId === userId);
  if (!state) {
    state = emptyState(userId);
    all.push(state);
  }
  return { all, state };
}

/** Awards XP once per idempotency key — calling this again with the same key is a safe no-op, the core anti-farming mechanism. */
function awardXp(state: UserLearningState, key: string, amount: number, reason: string): number {
  if (state.xpTransactions.some((tx) => tx.key === key)) {
    return 0; // Already awarded — this is what prevents duplicate rewards from retries/refreshes.
  }
  state.xpTransactions.push({
    id: crypto.randomUUID(),
    userId: state.userId,
    amount,
    reason,
    key,
    createdAt: new Date().toISOString(),
  });
  return amount;
}

export interface CompleteLessonResult {
  alreadyCompleted: boolean;
  xpAwarded: number;
}

export async function markLessonComplete(userId: string, lessonId: string): Promise<CompleteLessonResult> {
  const lesson = getLessonById(lessonId);
  if (!lesson || !lesson.isAvailable) {
    throw new Error("That lesson isn't available.");
  }

  const { all, state } = await getOrCreateState(userId);
  const existing = state.progress.find((p) => p.lessonId === lessonId);

  if (existing?.status === "completed") {
    await store.write(all);
    return { alreadyCompleted: true, xpAwarded: 0 };
  }

  const now = new Date().toISOString();
  if (existing) {
    existing.status = "completed";
    existing.completedAt = now;
  } else {
    state.progress.push({ lessonId, status: "completed", completedAt: now, quizAttempts: 0 });
  }

  let xpAwarded = awardXp(state, `lesson-complete:${lessonId}`, XP_REWARDS.LESSON_COMPLETE, `Completed "${lesson.title}"`);

  // Bonus XP if this completion just finished an entire category — idempotent per category.
  const categoryLessons = getLessonsByCategory(lesson.categoryId).filter((l) => l.isAvailable);
  const categoryNowComplete = categoryLessons.every((l) =>
    state.progress.some((p) => p.lessonId === l.id && p.status === "completed")
  );
  if (categoryNowComplete) {
    xpAwarded += awardXp(
      state,
      `category-complete:${lesson.categoryId}`,
      XP_REWARDS.CATEGORY_COMPLETE,
      `Completed the ${lesson.categoryId} category`
    );
  }

  state.streak = recordActivity(state.streak);

  await store.write(all);
  return { alreadyCompleted: false, xpAwarded };
}

export interface SubmitQuizResult {
  attempt: QuizAttemptResult;
  xpAwarded: number;
}

export async function recordQuizAttempt(
  userId: string,
  lessonId: string,
  correctCount: number,
  totalCount: number,
  gradedResults: QuizAttemptResult["results"]
): Promise<SubmitQuizResult> {
  const { all, state } = await getOrCreateState(userId);

  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const progress = state.progress.find((p) => p.lessonId === lessonId);
  const isNewBest = !progress?.bestQuizScore || scorePercent > progress.bestQuizScore;

  const attempt: QuizAttemptResult = {
    lessonId,
    attemptedAt: new Date().toISOString(),
    correctCount,
    totalCount,
    scorePercent,
    isNewBest,
    results: gradedResults,
  };
  state.quizAttempts.push(attempt);

  if (progress) {
    progress.quizAttempts += 1;
    if (isNewBest) progress.bestQuizScore = scorePercent;
  } else {
    state.progress.push({ lessonId, status: "in-progress", quizAttempts: 1, bestQuizScore: scorePercent });
  }

  // XP for the quiz itself and for correct answers is only ever awarded once per
  // lesson (on the first attempt) — retries help learning and update the best
  // score, but don't grant additional XP. This is the anti-farming rule for quizzes.
  const xpAwarded = awardXp(
    state,
    `quiz-xp:${lessonId}`,
    XP_REWARDS.QUIZ_COMPLETE + correctCount * XP_REWARDS.QUIZ_CORRECT_ANSWER,
    `Completed the quiz for lesson "${lessonId}"`
  );

  state.streak = recordActivity(state.streak);

  await store.write(all);
  return { attempt, xpAwarded };
}

export interface UserLearningSnapshot {
  progress: LessonProgress[];
  quizAttempts: QuizAttemptResult[];
  totalXp: number;
  streak: LearningStreakState;
}

export async function getUserLearningSnapshot(userId: string): Promise<UserLearningSnapshot> {
  try {
    const all = await store.read();
    const state = all.find((s) => s.userId === userId) ?? emptyState(userId);
    const totalXp = state.xpTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      progress: state.progress,
      quizAttempts: state.quizAttempts,
      totalXp,
      streak: getEffectiveStreak(state.streak),
    };
  } catch (error) {
    logger.error("Failed to load learning snapshot", { userId, error: String(error) });
    return { progress: [], quizAttempts: [], totalXp: 0, streak: { ...EMPTY_STREAK } };
  }
}

/** Used by the Security Center's Education category — a narrower, read-only view. */
export async function getLearningCompletionStats(
  userId: string
): Promise<{ lessonsCompleted: number; quizzesCompleted: number; averageQuizScore: number | null }> {
  const snapshot = await getUserLearningSnapshot(userId);
  const lessonsCompleted = snapshot.progress.filter((p) => p.status === "completed").length;
  const quizzesCompleted = snapshot.quizAttempts.length > 0 ? new Set(snapshot.quizAttempts.map((a) => a.lessonId)).size : 0;

  const bestScores = snapshot.progress.map((p) => p.bestQuizScore).filter((s): s is number => typeof s === "number");
  const averageQuizScore = bestScores.length > 0 ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length) : null;

  return { lessonsCompleted, quizzesCompleted, averageQuizScore };
}
