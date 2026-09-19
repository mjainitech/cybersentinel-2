import { describe, it, expect } from "vitest";
import { gradeQuiz } from "../quizGrading";
import { getLessonById } from "../../data/learningContent";

describe("gradeQuiz", () => {
  const lesson = getLessonById("what-is-cybersecurity");
  if (!lesson) throw new Error("Fixture lesson not found — test setup is broken.");

  it("counts a fully correct submission as 100%", () => {
    const correctAnswers = lesson.quiz.map((q) => q.choices.findIndex((c) => c.isCorrect));
    const result = gradeQuiz(lesson, correctAnswers);
    expect(result.correctCount).toBe(lesson.quiz.length);
    expect(result.totalCount).toBe(lesson.quiz.length);
  });

  it("counts a fully wrong submission as 0 correct", () => {
    const wrongAnswers = lesson.quiz.map((q) => q.choices.findIndex((c) => !c.isCorrect));
    const result = gradeQuiz(lesson, wrongAnswers);
    expect(result.correctCount).toBe(0);
  });

  it("grades each question independently — one right, one wrong", () => {
    const answers = [
      lesson.quiz[0].choices.findIndex((c) => c.isCorrect),
      lesson.quiz[1].choices.findIndex((c) => !c.isCorrect),
    ];
    const result = gradeQuiz(lesson, answers);
    expect(result.correctCount).toBe(1);
  });

  it("returns the real correct index and explanations in results, for post-submission review", () => {
    const answers = lesson.quiz.map(() => 0);
    const result = gradeQuiz(lesson, answers);
    expect(result.results).toHaveLength(lesson.quiz.length);
    for (const r of result.results) {
      expect(typeof r.correctIndex).toBe("number");
      expect(r.explanations.length).toBeGreaterThan(0);
    }
  });

  it("does not crash on an out-of-range or missing answer index", () => {
    const result = gradeQuiz(lesson, [99]);
    expect(result.correctCount).toBe(0);
  });
});
