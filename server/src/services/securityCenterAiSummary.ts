import { env } from "../config/env";
import { logger } from "./logger";
import { buildFallbackSecuritySummary } from "./securityCenterAiSummaryFallback";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { AiExplanation, SecurityCategoryResult } from "../types";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const AI_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a cybersecurity assistant summarizing someone's overall security posture based ONLY on summarized category scores from a security app called CyberSentinel — never any raw personal data.

You will receive: an overall score (or null if no data), and for each category: its title, whether it has data, its score if any, and a short explanation.

Write a concise, beginner-friendly summary covering:
1. What the person is doing well (verdict + reasons).
2. What areas need improvement.
3. Their highest-priority recommendations, grounded only in what the category data actually shows.

Style rules:
- Simple, calm, encouraging language — this is educational, not a scolding.
- Never claim something is true unless a category's own data supports it. If a category has no data, say the person hasn't tried that tool yet — don't guess at what they'd find.
- Never treat this as a certified security audit — it's a summary of activity inside one app.

Respond with ONLY a single JSON object, nothing else:
{
  "verdict": "one or two sentences",
  "reasons": ["short sentence", "..."],
  "risks": [],
  "recommendations": ["short sentence", "..."]
}

No preamble, no reasoning process, no markdown code fences, no text outside the JSON object. Always return an empty array for "risks" — this summary is about overall posture, not raising alarms.`;

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

export async function getSecurityCenterAiSummary(
  categories: SecurityCategoryResult[],
  overallScore: number | null
): Promise<AiExplanation> {
  if (!env.ANTHROPIC_API_KEY) {
    return buildFallbackSecuritySummary(categories, overallScore);
  }

  try {
    const payload = {
      overallScore,
      categories: categories.map((c) => ({
        title: c.title,
        hasData: c.hasData,
        score: c.score,
        explanation: c.explanation,
      })),
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
    logger.error("Security Center AI summary failed — using fallback", { error: String(error) });
    return buildFallbackSecuritySummary(categories, overallScore);
  }
}
