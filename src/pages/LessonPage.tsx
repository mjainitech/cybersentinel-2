import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Tooltip } from "@/components/Tooltip";
import { Quiz } from "@/components/Quiz";
import { useToast } from "@/hooks/useToast";
import { getLesson, completeLesson } from "@/services/learningService";
import type { LessonResponse } from "@/services/learningService";

const DIFFICULTY_COLOR: Record<string, string> = { beginner: "#22D3B8", intermediate: "#F5A623", advanced: "#EF5A5A" };

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState<LessonResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [isCompleting, setIsCompleting] = useState(false);
  const [scenarioChoice, setScenarioChoice] = useState<number | null>(null);
  const [showScenarioGuidance, setShowScenarioGuidance] = useState(false);

  const fetchLesson = useCallback(async () => {
    if (!id) return;
    setStatus("loading");
    setScenarioChoice(null);
    setShowScenarioGuidance(false);
    try {
      const result = await getLesson(id);
      setData(result);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleComplete = async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      const result = await completeLesson(id);
      if (result.alreadyCompleted) {
        showToast("Already marked complete.", "info");
      } else {
        showToast(result.xpAwarded > 0 ? `Lesson complete — +${result.xpAwarded} XP` : "Lesson complete.", "success");
      }
      fetchLesson();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong saving your progress.", "error");
    } finally {
      setIsCompleting(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading lesson..." className="mt-16 py-16" />
      </DashboardLayout>
    );
  }

  if (status === "error" || !data) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl animate-fade-up py-10 text-center">
          <p className="text-sm text-ink">This lesson couldn't be loaded.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchLesson}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { lesson } = data;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl animate-fade-up">
        <Link to="/dashboard/learning-hub" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Learning Hub
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
            style={{ color: DIFFICULTY_COLOR[lesson.difficulty], backgroundColor: `${DIFFICULTY_COLOR[lesson.difficulty]}1A` }}
          >
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-faint">
            <Clock className="h-3.5 w-3.5" />
            {lesson.estimatedMinutes} min
          </span>
          {data.status === "completed" && (
            <span className="flex items-center gap-1 text-xs font-medium text-accent-secondary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{lesson.title}</h1>

        <div className="mt-6 surface-card p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <BookOpen className="h-3.5 w-3.5" />
            Learning Objectives
          </h2>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {lesson.objectives.map((objective, i) => (
              <li key={i} className="text-sm text-ink-muted">
                • {objective}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <p className="text-sm leading-relaxed text-ink-muted">{lesson.explanation}</p>
        </div>

        {lesson.examples.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Examples</h2>
            <ul className="mt-2.5 flex flex-col gap-2">
              {lesson.examples.map((example, i) => (
                <li key={i} className="rounded-lg border border-base-border bg-base-elevated/30 p-3 text-sm text-ink-muted">
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.keyTerms.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Key Terms</h2>
            <div className="mt-2.5 flex flex-col gap-3">
              {lesson.keyTerms.map((kt) => (
                <details key={kt.term} className="group rounded-lg border border-base-border bg-base-elevated/30 p-3.5">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                    <Tooltip content={kt.simpleExplanation}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-base-border text-[10px] text-ink-faint">
                        i
                      </span>
                    </Tooltip>
                    {kt.term}
                  </summary>
                  <p className="mt-2 text-xs text-ink-muted">
                    <span className="font-medium text-ink-faint">Simple explanation: </span>
                    {kt.simpleExplanation}
                  </p>
                  <p className="mt-1.5 text-xs italic text-ink-faint">Example: {kt.example}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-accent-secondary">Learn more: {kt.learnMore}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-accent-primary">Why This Matters</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{lesson.whyThisMatters}</p>
          </div>
        </div>

        <div className="mt-6 surface-card p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <Info className="h-3.5 w-3.5" />
            Real-World Scenario: What Would You Do?
          </h2>
          <p className="mt-2.5 text-sm text-ink-muted">{lesson.scenario.prompt}</p>
          <div className="mt-3 flex flex-col gap-2">
            {lesson.scenario.options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setScenarioChoice(index);
                  setShowScenarioGuidance(true);
                }}
                disabled={showScenarioGuidance}
                aria-pressed={scenarioChoice === index}
                className="rounded-lg border border-base-border px-3.5 py-2.5 text-left text-sm text-ink-muted transition-colors hover:border-accent-primary/40 aria-pressed:border-accent-primary/50 aria-pressed:bg-accent-primary/10 aria-pressed:text-ink"
              >
                {option}
              </button>
            ))}
          </div>
          {showScenarioGuidance && (
            <div className="mt-3 rounded-lg border border-accent-secondary/25 bg-accent-secondary/5 p-3.5 text-sm text-ink-muted">
              {lesson.scenario.guidance}
            </div>
          )}
        </div>

        {lesson.quiz.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <HelpCircle className="h-3.5 w-3.5" />
              Quick Knowledge Check
            </h2>
            <div className="mt-3">
              <Quiz lessonId={lesson.id} questions={lesson.quiz} />
            </div>
          </div>
        )}

        {lesson.relatedTool && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-ink">
              <Sparkles className="h-4 w-4 text-accent-secondary" />
              Put this into practice.
            </div>
            <Link to={lesson.relatedTool.href}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                {lesson.relatedTool.label}
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant={data.status === "completed" ? "outline" : "primary"}
            onClick={handleComplete}
            isLoading={isCompleting}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            {data.status === "completed" ? "Completed" : "Mark as Complete"}
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-base-border pt-4">
          {data.previous ? (
            <button
              onClick={() => navigate(`/dashboard/learning-hub/lessons/${data.previous!.id}`)}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              {data.previous.title}
            </button>
          ) : (
            <span />
          )}
          {data.next && (
            <button
              onClick={() => navigate(`/dashboard/learning-hub/lessons/${data.next!.id}`)}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
            >
              {data.next.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
