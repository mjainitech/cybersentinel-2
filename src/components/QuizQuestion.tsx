import { Check, X } from "lucide-react";
import type { QuizQuestionPublic, QuizAnswerResult } from "@/services/learningService";
import { cn } from "@/utils/cn";

interface QuizQuestionProps {
  question: QuizQuestionPublic;
  questionNumber: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled: boolean;
  /** Present only after the quiz has been submitted and graded server-side. */
  result?: QuizAnswerResult;
}

export function QuizQuestion({ question, questionNumber, selectedIndex, onSelect, disabled, result }: QuizQuestionProps) {
  return (
    <fieldset className="rounded-xl border border-base-border bg-base-elevated/20 p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        {questionNumber}. {question.question}
      </legend>
      <div className="mt-3 flex flex-col gap-2">
        {question.choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectChoice = result && index === result.correctIndex;
          const isWrongSelected = result && isSelected && index !== result.correctIndex;

          return (
            <div key={index}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(index)}
                aria-pressed={isSelected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                  !result && isSelected && "border-accent-primary/50 bg-accent-primary/10 text-ink",
                  !result && !isSelected && "border-base-border text-ink-muted hover:border-accent-primary/30",
                  result && isCorrectChoice && "border-accent-secondary/50 bg-accent-secondary/10 text-ink",
                  result && isWrongSelected && "border-accent-danger/50 bg-accent-danger/10 text-ink",
                  result && !isCorrectChoice && !isWrongSelected && "border-base-border text-ink-faint"
                )}
              >
                {result && isCorrectChoice && <Check className="h-4 w-4 shrink-0 text-accent-secondary" />}
                {result && isWrongSelected && <X className="h-4 w-4 shrink-0 text-accent-danger" />}
                <span>{choice.text}</span>
              </button>
              {result && (isSelected || isCorrectChoice) && (
                <p className="mt-1 px-3.5 text-xs leading-relaxed text-ink-faint">{result.explanations[index]}</p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
