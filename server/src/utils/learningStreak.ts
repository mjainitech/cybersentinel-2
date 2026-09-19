import type { LearningStreakState } from "../types";

/** Normalizes any Date to a UTC "YYYY-MM-DD" string — keeps streak logic simple and timezone-consistent. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

/**
 * Records today's activity (idempotent — calling this multiple times
 * in one day doesn't inflate the streak) and recalculates current/longest streak.
 */
export function recordActivity(state: LearningStreakState, activityDate: Date = new Date()): LearningStreakState {
  const todayKey = toDateKey(activityDate);
  const activityDates = state.activityDates.includes(todayKey)
    ? state.activityDates
    : [...state.activityDates, todayKey].sort();

  let currentStreak = 1;
  if (state.lastActivityDate) {
    const gap = daysBetween(state.lastActivityDate, todayKey);
    if (gap === 0) {
      currentStreak = state.currentStreak; // Already logged today — streak unchanged.
    } else if (gap === 1) {
      currentStreak = state.currentStreak + 1; // Consecutive day.
    } else {
      currentStreak = 1; // Gap of 2+ days breaks the streak.
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActivityDate: todayKey,
    activityDates,
  };
}

/** Re-derives the current streak from stored activity dates and "now" — used so a streak correctly resets to 0 after a real gap, even without new activity to trigger a recalculation. */
export function getEffectiveStreak(state: LearningStreakState, now: Date = new Date()): LearningStreakState {
  if (!state.lastActivityDate) return state;

  const todayKey = toDateKey(now);
  const gap = daysBetween(state.lastActivityDate, todayKey);

  if (gap <= 1) return state; // Still within the streak window (today or yesterday's activity).

  return { ...state, currentStreak: 0 };
}

export const EMPTY_STREAK: LearningStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  activityDates: [],
};
