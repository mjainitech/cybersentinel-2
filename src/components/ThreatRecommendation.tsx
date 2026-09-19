import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
import type { ThreatRecommendation as ThreatRecommendationType } from "@/services/threatService";
import { Button } from "@/components/Button";

interface ThreatRecommendationProps {
  recommendations: ThreatRecommendationType[];
  relatedLessonId?: string;
}

/** Only ever shows recommendations the backend actually generated from this threat's own category — never claims relevance beyond what the data supports. */
export function ThreatRecommendation({ recommendations, relatedLessonId }: ThreatRecommendationProps) {
  if (recommendations.length === 0 && !relatedLessonId) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {relatedLessonId && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/5 p-4">
          <div className="flex items-center gap-2 text-sm text-ink">
            <GraduationCap className="h-4 w-4 text-accent-secondary" />
            Related lesson available
          </div>
          <Link to={`/dashboard/learning-hub/lessons/${relatedLessonId}`}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open Lesson
            </Button>
          </Link>
        </div>
      )}
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 rounded-xl border border-base-border bg-base-elevated/30 p-4"
        >
          <p className="text-sm text-ink-muted">Put this into practice.</p>
          <Link to={rec.href}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              {rec.label}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
