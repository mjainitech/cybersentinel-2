import type { Lesson, LessonDifficulty, LearningCategoryId } from "../types";

export interface LessonFilterOptions {
  search?: string;
  difficulty?: LessonDifficulty;
  categoryId?: LearningCategoryId;
}

/** Matches against title, explanation, and key terms — covers "Titles, Descriptions, Topics, Cybersecurity terms" from the spec. */
function matchesSearch(lesson: Lesson, query: string): boolean {
  const term = query.toLowerCase();
  return (
    lesson.title.toLowerCase().includes(term) ||
    lesson.explanation.toLowerCase().includes(term) ||
    lesson.keyTerms.some((kt) => kt.term.toLowerCase().includes(term) || kt.simpleExplanation.toLowerCase().includes(term))
  );
}

export function filterLessons(lessons: Lesson[], options: LessonFilterOptions): Lesson[] {
  return lessons.filter((lesson) => {
    if (options.search && !matchesSearch(lesson, options.search)) return false;
    if (options.difficulty && lesson.difficulty !== options.difficulty) return false;
    if (options.categoryId && lesson.categoryId !== options.categoryId) return false;
    return true;
  });
}
