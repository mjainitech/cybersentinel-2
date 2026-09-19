import { describe, it, expect } from "vitest";
import { recordActivity, getEffectiveStreak, toDateKey, EMPTY_STREAK } from "../learningStreak";

describe("recordActivity", () => {
  it("starts a streak of 1 on the first recorded activity", () => {
    const result = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("does not increase the streak for a second activity on the same day", () => {
    const day1 = recordActivity(EMPTY_STREAK, new Date("2024-01-01T09:00:00Z"));
    const sameDayAgain = recordActivity(day1, new Date("2024-01-01T18:00:00Z"));
    expect(sameDayAgain.currentStreak).toBe(1);
  });

  it("increments the streak for activity on the very next day", () => {
    const day1 = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const day2 = recordActivity(day1, new Date("2024-01-02T12:00:00Z"));
    expect(day2.currentStreak).toBe(2);
  });

  it("resets the streak to 1 after a gap of more than one day", () => {
    const day1 = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const day5 = recordActivity(day1, new Date("2024-01-05T12:00:00Z"));
    expect(day5.currentStreak).toBe(1);
  });

  it("tracks longestStreak independently of the current streak resetting", () => {
    const day1 = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const day2 = recordActivity(day1, new Date("2024-01-02T12:00:00Z"));
    const day3 = recordActivity(day2, new Date("2024-01-03T12:00:00Z"));
    const afterGap = recordActivity(day3, new Date("2024-01-10T12:00:00Z"));
    expect(afterGap.currentStreak).toBe(1);
    expect(afterGap.longestStreak).toBe(3);
  });

  it("records the activity date for the calendar visualization, without duplicates", () => {
    const day1 = recordActivity(EMPTY_STREAK, new Date("2024-01-01T09:00:00Z"));
    const sameDayAgain = recordActivity(day1, new Date("2024-01-01T20:00:00Z"));
    expect(sameDayAgain.activityDates).toEqual([toDateKey(new Date("2024-01-01T09:00:00Z"))]);
  });
});

describe("getEffectiveStreak", () => {
  it("keeps the streak intact when 'now' is the same day as last activity", () => {
    const state = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const effective = getEffectiveStreak(state, new Date("2024-01-01T23:00:00Z"));
    expect(effective.currentStreak).toBe(1);
  });

  it("keeps the streak intact the day right after (still within the grace window)", () => {
    const state = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const effective = getEffectiveStreak(state, new Date("2024-01-02T09:00:00Z"));
    expect(effective.currentStreak).toBe(1);
  });

  it("zeroes out a stale streak once more than a day has passed with no new activity", () => {
    const state = recordActivity(EMPTY_STREAK, new Date("2024-01-01T12:00:00Z"));
    const effective = getEffectiveStreak(state, new Date("2024-01-05T12:00:00Z"));
    expect(effective.currentStreak).toBe(0);
  });

  it("leaves a never-started streak alone", () => {
    expect(getEffectiveStreak(EMPTY_STREAK).currentStreak).toBe(0);
  });
});
