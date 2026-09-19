import { env } from "../config/env";
import { logger } from "./logger";
import { buildFallbackAnalyticsSummary } from "./analyticsAiSummaryFallback";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { AiExplanation, SecurityImprovementItem, AnalyticsInsight, SecurityRecommendation } from "../types";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const AI_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a cybersecurity assistant summarizing someone's security analytics from a platform called CyberSentinel. You will receive ONLY already-verified, summarized data — an overall score, a list of improvement/decline observations, insights, and top-priority recommendations. Never invent any statistic not present in the input.

Write a concise, beginner-friendly summary covering:
1. What improved.
2. What still needs attention.
3. What the user should focus on next — grounded only in the provided top priorities.

Style rules:
- Calm, factual, encouraging — this is educational, not a professional security audit or a certification.
- Never invent a number, trend, or finding not present in the input.
- If there's genuinely little data, say so plainly rather than inventing something to say.

Respond with ONLY a single JSON object, nothing else:
{
  "verdict": "one or two sentences",
  "reasons": ["short sentence", "..."],
  "risks": [],
  "recommendations": ["short sentence", "..."]
}

No preamble, no reasoning process, no markdown code fences, no text outside the JSON object. Always return an empty array for "risks".`;

interface ParsedPayload {
  verdict: string;
  reasons: string[];
  risks: string[];
  recommendations: string[];
}

function isParsedPayload(value: unknown): value is ParsedPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.verdict === "string" &&
    Array.isArray(v.reasons) &&
    v.reasons.every((r) => typeof r === "string") &&
    Array.isArray(v.risks) &&
    Array.isArray(v.recommendations) &&
    v.recommendations.every((r) => typeof r === "string")
  );
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

export async function getAnalyticsAiSummary(
  overallScore: number | null,
  improvements: SecurityImprovementItem[],
  insights: AnalyticsInsight[],
  topPriorities: SecurityRecommendation[]
): Promise<AiExplanation> {
  if (!env.ANTHROPIC_API_KEY) {
    return buildFallbackAnalyticsSummary(overallScore, improvements, insights, topPriorities);
  }

  try {
    const payload = {
      overallScore,
      improvements: improvements.map((i) => ({ text: i.text, direction: i.direction })),
      insights: insights.map((i) => i.text),
      topPriorities: topPriorities.map((p) => ({ text: p.text, priority: p.priority })),
    };

    const response = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: JSON.stringify(payload) }],
        }),
      },
      AI_TIMEOUT_MS
    );

    if (!response.ok) throw new Error(`Anthropic API responded with ${response.status}`);

    const body = await response.json();
    const textBlock = body?.content?.find((block: { type: string }) => block.type === "text");
    if (!textBlock?.text) throw new Error("Anthropic API response had no text content");

    const parsed = JSON.parse(stripCodeFences(textBlock.text));
    if (!isParsedPayload(parsed)) throw new Error("AI response did not match the expected shape");

    return { verdict: parsed.verdict, reasons: parsed.reasons, risks: parsed.risks, nextSteps: parsed.recommendations, generatedByAi: true };
  } catch (error) {
    logger.error("Analytics AI summary failed — using fallback", { error: String(error) });
    return buildFallbackAnalyticsSummary(overallScore, improvements, insights, topPriorities);
  }
}
