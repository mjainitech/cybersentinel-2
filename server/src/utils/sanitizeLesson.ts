import type { Lesson, LessonPublic } from "../types";

/**
 * CRITICAL: this is what enforces "do not reveal the answer until
 * the user submits." The full Lesson object (used server-side for
 * grading) includes isCorrect/explanation on every quiz choice —
 * this strips all of that before the lesson is ever sent to the client.
 */
export function sanitizeLessonForClient(lesson: Lesson): LessonPublic {
  return {
    ...lesson,
    quiz: lesson.quiz.map((question) => ({
      id: question.id,
      question: question.question,
      choices: question.choices.map((choice) => ({ text: choice.text })),
    })),
  };
}
