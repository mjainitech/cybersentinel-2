import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { QuizQuestion } from "@/components/QuizQuestion";
import { Button } from "@/components/Button";
import { submitQuiz } from "@/services/learningService";
import type { QuizQuestionPublic, QuizAttemptResult } from "@/services/learningService";
import { useToast } from "@/hooks/useToast";

interface QuizProps {
  lessonId: string;
  questions: QuizQuestionPublic[];
  onGraded?: (attempt: QuizAttemptResult, xpAwarded: number) => void;
}

/**
 * Answers are never revealed until submission — this component only
 * ever holds the selected indices locally; the real answer key lives
 * server-side and grading happens there (see submitQuiz).
 */
export function Quiz({ lessonId, questions, onGraded }: QuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [attempt, setAttempt] = useState<QuizAttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const allAnswered = answers.every((a) => a !== null);

  const handleSubmit = async () => {
    if (!allAnswered) {
      showToast("Please answer every question before submitting.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuiz(lessonId, answers as number[]);
      setAttempt(result.attempt);
      onGraded?.(result.attempt, result.xpAwarded);
      if (result.xpAwarded > 0) {
        showToast(`Quiz submitted — +${result.xpAwarded} XP`, "success");
      } else {
        showToast("Quiz submitted. XP for this quiz was already awarded on a previous attempt.", "info");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong submitting your quiz.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAttempt(null);
    setAnswers(questions.map(() => null));
  };

  return (
    <div className="flex flex-col gap-4">
      {attempt && (
        <div className="flex items-center gap-3 rounded-xl border border-accent-primary/25 bg-accent-primary/5 p-4">
          <Sparkles className="h-5 w-5 shrink-0 text-accent-primary" />
          <div>
            <p className="text-sm font-medium text-ink">
              You got {attempt.correctCount} of {attempt.totalCount} correct ({attempt.scorePercent}%)
            </p>
            <p className="text-xs text-ink-muted">
              {attempt.isNewBest ? "That's a new best score for this lesson." : "Review the explanations below, then try again anytime."}
            </p>
          </div>
        </div>
      )}

      {questions.map((question, index) => (
        <QuizQuestion
          key={question.id}
          question={question}
          questionNumber={index + 1}
          selectedIndex={answers[index]}
          onSelect={(choiceIndex) => {
            if (attempt) return; // Locked once graded — use Retry to try again.
            setAnswers((prev) => prev.map((a, i) => (i === index ? choiceIndex : a)));
          }}
          disabled={Boolean(attempt)}
          result={attempt?.results.find((r) => r.questionId === question.id)}
        />
      ))}

      {attempt ? (
        <Button variant="outline" onClick={handleRetry} leftIcon={<RotateCcw className="h-4 w-4" />} className="self-start">
          Retry quiz
        </Button>
      ) : (
        <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!allAnswered} className="self-start">
          Submit Answers
        </Button>
      )}
    </div>
  );
}
