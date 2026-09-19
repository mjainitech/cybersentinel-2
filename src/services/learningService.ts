import { authHeader } from "@/services/authToken";

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LearningCategoryId =
  | "fundamentals"
  | "online-safety"
  | "phishing-social-engineering"
  | "web-security"
  | "malware"
  | "privacy"
  | "application-security";

export type LessonStatus = "not-started" | "in-progress" | "completed";

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  lessonCount: number;
  availableLessonCount: number;
}

export interface CatalogLesson {
  id: string;
  categoryId: LearningCategoryId;
  title: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  order: number;
  isAvailable: boolean;
  status: LessonStatus;
}

export interface KeyTerm {
  term: string;
  simpleExplanation: string;
  example: string;
  learnMore: string;
}

export interface QuizChoicePublic {
  text: string;
}

export interface QuizQuestionPublic {
  id: string;
  question: string;
  choices: QuizChoicePublic[];
}

export interface RealWorldScenario {
  prompt: string;
  options: string[];
  safestOptionIndex: number;
  guidance: string;
}

export interface LessonPublic {
  id: string;
  categoryId: LearningCategoryId;
  title: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  order: number;
  objectives: string[];
  explanation: string;
  examples: string[];
  keyTerms: KeyTerm[];
  whyThisMatters: string;
  scenario: RealWorldScenario;
  quiz: QuizQuestionPublic[];
  relatedTool?: { label: string; href: string };
  isAvailable: boolean;
}

export interface LessonResponse {
  lesson: LessonPublic;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  status: LessonStatus;
  bestQuizScore: number | null;
}

export interface QuizAnswerResult {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  explanations: string[];
}

export interface QuizAttemptResult {
  lessonId: string;
  attemptedAt: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  isNewBest: boolean;
  results: QuizAnswerResult[];
}

export interface LearningStreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  activityDates: string[];
}

export interface LearningProfile {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpForNextLevel: number | null;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number | null;
  lessonsCompleted: number;
  totalAvailableLessons: number;
  completionPercent: number;
  quizzesCompleted: number;
  achievementsEarned: number;
  streak: LearningStreakState;
  categoryProgress: { categoryId: LearningCategoryId; completed: number; total: number }[];
}

/** Structurally identical to the Security Center's Achievement type — reuses the same AchievementCard component. */
export interface LearningAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  earnedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export interface CatalogParams {
  search?: string;
  difficulty?: LessonDifficulty;
  category?: LearningCategoryId;
}

export async function getCatalog(
  params: CatalogParams = {}
): Promise<{ categories: LearningCategory[]; lessons: CatalogLesson[] }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.category) query.set("category", params.category);

  const response = await fetch(`${API_BASE_URL}/api/learning/catalog?${query.toString()}`, {
    headers: { ...authHeader() },
  });
  return handle(response);
}

export async function getLesson(id: string): Promise<LessonResponse> {
  const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${id}`, {
    headers: { ...authHeader() },
  });
  return handle(response);
}

export async function completeLesson(id: string): Promise<{ alreadyCompleted: boolean; xpAwarded: number }> {
  const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${id}/complete`, {
    method: "POST",
    headers: { ...authHeader() },
  });
  return handle(response);
}

export async function submitQuiz(id: string, answers: number[]): Promise<{ attempt: QuizAttemptResult; xpAwarded: number }> {
  const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${id}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ answers }),
  });
  return handle(response);
}

export async function getLearningProfile(): Promise<{ profile: LearningProfile; achievements: LearningAchievement[] }> {
  const response = await fetch(`${API_BASE_URL}/api/learning/profile`, {
    headers: { ...authHeader() },
  });
  return handle(response);
}

export const CATEGORY_LABELS: Record<LearningCategoryId, string> = {
  fundamentals: "Cybersecurity Fundamentals",
  "online-safety": "Online Safety",
  "phishing-social-engineering": "Phishing & Social Engineering",
  "web-security": "Web Security",
  malware: "Malware",
  privacy: "Privacy",
  "application-security": "Application Security",
};
