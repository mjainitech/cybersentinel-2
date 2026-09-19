import { Flame } from "lucide-react";
import type { LearningStreakState } from "@/services/learningService";

interface LearningStreakProps {
  streak: LearningStreakState;
}

const DAYS_TO_SHOW = 14;

export function LearningStreak({ streak }: LearningStreakProps) {
  const activitySet = new Set(streak.activityDates);
  const days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (DAYS_TO_SHOW - 1 - i));
    const key = date.toISOString().slice(0, 10);
    return { key, active: activitySet.has(key) };
  });

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-danger/10 text-accent-danger">
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-xl font-semibold text-ink">
            {streak.currentStreak} day{streak.currentStreak === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-ink-faint">
            Current streak · Longest: {streak.longestStreak} day{streak.longestStreak === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1" role="img" aria-label={`Activity over the last ${DAYS_TO_SHOW} days`}>
        {days.map((day) => (
          <span
            key={day.key}
            title={day.key}
            className="h-4 w-4 rounded-sm"
            style={{ backgroundColor: day.active ? "#EF5A5A" : "#232B3D" }}
          />
        ))}
      </div>
    </div>
  );
}
