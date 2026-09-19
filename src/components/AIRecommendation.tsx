import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { trackLessonOpened, trackToolOpened } from "@/services/aiCoachService";
import type { RecommendedLesson, RecommendedTool } from "@/services/aiCoachService";

interface AIRecommendationProps {
  lesson?: RecommendedLesson;
  tool?: RecommendedTool;
}

/** These links are always built server-side from a controlled mapping — never a URL the AI generated itself. */
export function AIRecommendation({ lesson, tool }: AIRecommendationProps) {
  if (!lesson && !tool) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {lesson && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/5 p-3">
          <div className="flex items-center gap-2 text-sm text-ink">
            <GraduationCap className="h-4 w-4 text-accent-secondary" />
            Recommended Lesson: {lesson.title}
          </div>
          <Link to={`/dashboard/learning-hub/lessons/${lesson.lessonId}`} onClick={() => trackLessonOpened()}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Start Lesson
            </Button>
          </Link>
        </div>
      )}
      {tool && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-primary/25 bg-accent-primary/5 p-3">
          <p className="text-sm text-ink">Recommended Tool</p>
          <Link to={tool.href} onClick={() => trackToolOpened()}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              {tool.label}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
