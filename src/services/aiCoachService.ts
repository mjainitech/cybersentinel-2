import { authHeader } from "@/services/authToken";

export interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
}

export type ExplainContextKind =
  | "security-profile"
  | "website-scan"
  | "password-score"
  | "breach-result"
  | "phishing-result"
  | "privacy-result"
  | "analytics-trend"
  | "threat";

export interface ExplainRequest {
  kind: ExplainContextKind;
  threatId?: string;
}

export interface RecommendedLesson {
  lessonId: string;
  title: string;
}

export interface RecommendedTool {
  label: string;
  href: string;
}

export interface AiCoachResponse {
  reply: string;
  recommendedLesson?: RecommendedLesson;
  recommendedTool?: RecommendedTool;
  usedPersonalContext: boolean;
}

export interface AiCoachUsageStats {
  conversationsStarted: number;
  questionsAsked: number;
  lessonsOpened: number;
  toolsOpened: number;
}

export const SUGGESTED_QUESTIONS = [
  "What should I improve first?",
  "Why is my security score low?",
  "Explain my recent scan results.",
  "How can I protect my accounts?",
  "What does my breach result mean?",
  "What should I learn next?",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return response.json();
}

export async function sendCoachMessage(
  message: string,
  history: ChatMessageData[],
  explain?: ExplainRequest
): Promise<AiCoachResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai-coach/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ message, history, explain }),
  });
  return handle(response);
}

export async function trackLessonOpened(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/ai-coach/track/lesson-opened`, { method: "POST", headers: { ...authHeader() } }).catch(
    () => undefined
  );
}

export async function trackToolOpened(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/ai-coach/track/tool-opened`, { method: "POST", headers: { ...authHeader() } }).catch(() => undefined);
}
