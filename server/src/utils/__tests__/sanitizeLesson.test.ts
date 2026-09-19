import { describe, it, expect } from "vitest";
import { sanitizeLessonForClient } from "../sanitizeLesson";
import { getLessonById } from "../../data/learningContent";

describe("sanitizeLessonForClient", () => {
  const lesson = getLessonById("what-is-cybersecurity");
  if (!lesson) throw new Error("Fixture lesson not found — test setup is broken.");

  it("strips isCorrect from every quiz choice", () => {
    const sanitized = sanitizeLessonForClient(lesson);
    for (const question of sanitized.quiz) {
      for (const choice of question.choices) {
        expect((choice as Record<string, unknown>).isCorrect).toBeUndefined();
      }
    }
  });

  it("strips explanation text from every quiz choice", () => {
    const sanitized = sanitizeLessonForClient(lesson);
    for (const question of sanitized.quiz) {
      for (const choice of question.choices) {
        expect((choice as Record<string, unknown>).explanation).toBeUndefined();
      }
    }
  });

  it("preserves the question text and choice text, since those are safe to show before submission", () => {
    const sanitized = sanitizeLessonForClient(lesson);
    expect(sanitized.quiz[0].question).toBe(lesson.quiz[0].question);
    expect(sanitized.quiz[0].choices.map((c) => c.text)).toEqual(lesson.quiz[0].choices.map((c) => c.text));
  });

  it("preserves all non-quiz lesson content unchanged", () => {
    const sanitized = sanitizeLessonForClient(lesson);
    expect(sanitized.title).toBe(lesson.title);
    expect(sanitized.explanation).toBe(lesson.explanation);
    expect(sanitized.keyTerms).toEqual(lesson.keyTerms);
  });
});
