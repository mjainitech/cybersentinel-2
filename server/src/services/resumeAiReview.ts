import { env } from "../config/env";
import { logger } from "./logger";
import { buildFallbackResumeReview } from "./resumeAiReviewFallback";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { PII_CATEGORY_LABELS } from "./piiDetection";
import type { DetectedPiiItem, PrivacyRating, ResumeAiReview } from "../types";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const AI_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a privacy education assistant reviewing what personal information was found on someone's resume by an automated scanner — you are not analyzing the resume yourself, only the list of findings you're given.

You will receive the resume's privacy score, privacy rating, and a list of detected personal-information categories.

Write a short, beginner-friendly privacy review covering:
1. A one-sentence summary of what was found overall.
2. Specifically what personal information was found (foundInfo) — one short sentence per category, plain language.
3. What real-world risks (if any) this could create (risks) — grounded and realistic, not alarmist.
4. What the person should consider doing next (recommendations).

Style rules:
- Use short, simple sentences a complete beginner would understand.
- Stay grounded only in the provided findings — never invent details that aren't in the input, and never guess at the person's actual name, address, or other specifics beyond the category detected.
- Avoid fear-based or alarmist language ("hackers will find you", "you will be a victim of..."). Be calm, factual, and constructive — the goal is to inform, not scare.
- If nothing concerning was found, say so plainly and warmly rather than searching for something to warn about.

Respond with ONLY a single JSON object, nothing else:
{
  "summary": "one sentence",
  "foundInfo": ["short sentence", "..."],
  "risks": ["short sentence", "..."],
  "recommendations": ["short sentence", "..."]
}

Do not include any explanation of your reasoning process, any preamble, any markdown code fences, or any text outside the JSON object. If no risks apply, return an empty array for "risks".`;

interface ParsedReviewPayload {
  summary: string;
  foundInfo: string[];
  risks: string[];
  recommendations: string[];
}

function isParsedReviewPayload(value: unknown): value is ParsedReviewPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    Array.isArray(v.foundInfo) &&
    v.foundInfo.every((r) => typeof r === "string") &&
    Array.isArray(v.risks) &&
    v.risks.every((r) => typeof r === "string") &&
    Array.isArray(v.recommendations) &&
    v.recommendations.every((r) => typeof r === "string")
  );
}

/** Strips ```json fences if the model added them despite instructions not to. */
function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

/**
 * Generates the beginner-friendly privacy review shown in the AI
 * Privacy Review card. Falls back to a rule-based review (same
 * shape, no AI) whenever the API key is missing, the call fails, or
 * the model's response doesn't parse into the expected shape — the
 * card never shows an error or goes blank. Only category labels and
 * counts are sent to the AI, never the raw resume text itself.
 */
export async function getResumeAiReview(
  score: number,
  rating: PrivacyRating,
  detected: DetectedPiiItem[]
): Promise<ResumeAiReview> {
  if (!env.ANTHROPIC_API_KEY) {
    return buildFallbackResumeReview(detected, rating);
  }

  try {
    const payload = {
      score,
      rating,
      detected: detected.map((item) => ({ category: PII_CATEGORY_LABELS[item.category] })),
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

    if (!response.ok) {
      throw new Error(`Anthropic API responded with ${response.status}`);
    }

    const body = await response.json();
    const textBlock = body?.content?.find((block: { type: string }) => block.type === "text");

    if (!textBlock?.text) {
      throw new Error("Anthropic API response had no text content");
    }

    const parsed = JSON.parse(stripCodeFences(textBlock.text));

    if (!isParsedReviewPayload(parsed)) {
      throw new Error("AI response did not match the expected shape");
    }

    return { ...parsed, generatedByAi: true };
  } catch (error) {
    logger.error("Resume AI review failed — using fallback", { error: String(error) });
    return buildFallbackResumeReview(detected, rating);
  }
}
