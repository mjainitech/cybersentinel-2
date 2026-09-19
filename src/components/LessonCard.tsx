import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import type { CatalogLesson } from "@/services/learningService";
import { cn } from "@/utils/cn";

interface LessonCardProps {
  lesson: CatalogLesson;
}

const DIFFICULTY_COLOR: Record<CatalogLesson["difficulty"], string> = {
  beginner: "#22D3B8",
  intermediate: "#F5A623",
  advanced: "#EF5A5A",
};

export function LessonCard({ lesson }: LessonCardProps) {
  if (!lesson.isAvailable) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-base-border bg-base-elevated/20 p-4 opacity-60">
        <Lock className="h-4 w-4 shrink-0 text-ink-faint" />
        <div className="flex-1">
          <p className="text-sm text-ink-faint">{lesson.title}</p>
          <p className="text-[11px] text-ink-faint">Coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/dashboard/learning-hub/lessons/${lesson.id}`}
      className="flex items-center gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-4 transition-colors hover:border-accent-primary/40 hover:bg-base-elevated/50"
    >
      {lesson.status === "completed" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-secondary" />
      ) : (
        <Circle className={cn("h-4 w-4 shrink-0", lesson.status === "in-progress" ? "text-accent-primary" : "text-ink-faint")} />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{lesson.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lesson.estimatedMinutes} min
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 font-medium capitalize"
            style={{ color: DIFFICULTY_COLOR[lesson.difficulty], backgroundColor: `${DIFFICULTY_COLOR[lesson.difficulty]}1A` }}
          >
            {lesson.difficulty}
          </span>
        </div>
      </div>
    </Link>
  );
}
