import type { Lesson, QuizAttemptResult } from "../types";

export interface QuizGradingResult {
  correctCount: number;
  totalCount: number;
  results: QuizAttemptResult["results"];
}

/**
 * Grades a set of selected answer indices against a lesson's real
 * answer key. This is the one place scoring actually happens — the
 * client only ever sends which index it picked per question.
 */
export function gradeQuiz(lesson: Lesson, answers: number[]): QuizGradingResult {
  let correctCount = 0;

  const results: QuizAttemptResult["results"] = lesson.quiz.map((question, index) => {
    const selectedIndex = answers[index];
    const correctIndex = question.choices.findIndex((c) => c.isCorrect);
    if (selectedIndex === correctIndex) correctCount++;

    return {
      questionId: question.id,
      selectedIndex,
      correctIndex,
      explanations: question.choices.map((c) => c.explanation),
    };
  });

  return { correctCount, totalCount: lesson.quiz.length, results };
}
