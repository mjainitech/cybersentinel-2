import { Bot, User } from "lucide-react";
import { AIResponse } from "@/components/AIResponse";
import { AIRecommendation } from "@/components/AIRecommendation";
import type { RecommendedLesson, RecommendedTool } from "@/services/aiCoachService";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  usedPersonalContext?: boolean;
  recommendedLesson?: RecommendedLesson;
  recommendedTool?: RecommendedTool;
}

export function ChatMessage({ role, content, usedPersonalContext, recommendedLesson, recommendedTool }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-accent-primary/15 text-accent-primary" : "bg-accent-secondary/15 text-accent-secondary"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-accent-primary/10 text-ink" : "surface-card"}`}>
        {isUser ? (
          <p className="text-sm text-ink">{content}</p>
        ) : (
          <>
            <AIResponse content={content} />
            <AIRecommendation lesson={recommendedLesson} tool={recommendedTool} />
            {usedPersonalContext && <p className="mt-2 text-[11px] italic text-ink-faint">Based on your CyberSentinel data.</p>}
          </>
        )}
      </div>
    </div>
  );
}
