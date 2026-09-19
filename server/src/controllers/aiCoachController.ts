import type { Request, Response } from "express";
import { logger } from "../services/logger";
import { buildSecurityContext } from "../services/securityContextService";
import { getCoachReply, MAX_MESSAGE_LENGTH, MAX_HISTORY_MESSAGES } from "../services/aiCoachService";
import { detectTopics, getRecommendedLesson, getRecommendedTool } from "../utils/aiCoachTopics";
import {
  recordConversationStarted,
  recordQuestionAsked,
  recordLessonOpened,
  recordToolOpened,
  getUsageStats,
} from "../services/aiCoachUsageStore";
import type { ChatMessage, ExplainRequest, ExplainContextKind } from "../types";

const VALID_EXPLAIN_KINDS: ExplainContextKind[] = [
  "security-profile",
  "website-scan",
  "password-score",
  "breach-result",
  "phishing-result",
  "privacy-result",
  "analytics-trend",
  "threat",
];

function validateHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" && m !== null && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    )
    .slice(-MAX_HISTORY_MESSAGES);
}

function validateExplain(value: unknown): ExplainRequest | undefined {
  if (!value || typeof value !== "object") return undefined;
  const kind = (value as Record<string, unknown>).kind;
  if (typeof kind !== "string" || !VALID_EXPLAIN_KINDS.includes(kind as ExplainContextKind)) return undefined;

  const threatId = (value as Record<string, unknown>).threatId;
  return { kind: kind as ExplainContextKind, threatId: typeof threatId === "string" ? threatId.slice(0, 100) : undefined };
}

export async function sendMessage(req: Request, res: Response) {
  const rawMessage = req.body?.message;

  if (typeof rawMessage !== "string" || !rawMessage.trim()) {
    return res.status(400).json({ error: "Please enter a message." });
  }
  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  const history = validateHistory(req.body?.history);
  const explain = validateExplain(req.body?.explain);
  const userId = req.userId!;

  try {
    const topics = detectTopics(rawMessage);
    const context = await buildSecurityContext(userId, topics, explain);
    const { reply, generatedByAi } = await getCoachReply(rawMessage, history, context);

    const recommendedLesson = getRecommendedLesson(topics);
    const recommendedTool = getRecommendedTool(topics);

    // Usage counters only — never conversation content. Best-effort; a
    // failure here should never break the actual chat response.
    recordQuestionAsked(userId).catch(() => undefined);
    if (history.length === 0) recordConversationStarted(userId).catch(() => undefined);

    return res.json({
      reply,
      recommendedLesson,
      recommendedTool,
      usedPersonalContext: generatedByAi || context.length > 0,
    });
  } catch (error) {
    logger.error("AI Coach message failed", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

export async function trackLessonOpened(req: Request, res: Response) {
  try {
    await recordLessonOpened(req.userId!);
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to record lesson-opened usage", { error: String(error) });
    return res.status(204).send(); // Best-effort analytics — never fail the user's action over this.
  }
}

export async function trackToolOpened(req: Request, res: Response) {
  try {
    await recordToolOpened(req.userId!);
    return res.status(204).send();
  } catch (error) {
    logger.error("Failed to record tool-opened usage", { error: String(error) });
    return res.status(204).send();
  }
}

export async function getUsage(req: Request, res: Response) {
  try {
    const stats = await getUsageStats(req.userId!);
    return res.json({ stats });
  } catch (error) {
    logger.error("Failed to load AI Coach usage stats", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong loading usage stats." });
  }
}
