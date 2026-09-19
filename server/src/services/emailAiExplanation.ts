import { env } from "../config/env";
import { logger } from "./logger";
import { buildFallbackEmailExplanation } from "./emailAiExplanationFallback";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { EMAIL_CLASSIFICATION_LABELS } from "../utils/emailRiskScore";
import type { AiExplanation, EmailIndicator, EmailRiskClassification } from "../types";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const AI_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a cybersecurity assistant that explains automated email phishing analysis results to complete beginners — people with no technical background. You are analyzing a summary of an EMAIL, not a website.

You will receive the email's risk score, classification, and a list of detected indicator categories (things like urgent language, credential requests, sender mismatches, suspicious links).

Write a short, beginner-friendly explanation covering:
1. Whether the email looks safe, in one clear sentence.
2. Why it received this score — in simple, everyday language, referencing only the indicators actually provided.
3. What specific risks this email could pose if acted on.
4. What the user should do next.

Style rules:
- Use short, simple sentences. Avoid jargon.
- Stay grounded only in the provided indicator data — never invent specific details (like a claimed sender name or company) that weren't given to you.
- Typical good next steps: verify the sender independently, avoid clicking unknown links, contact the organization through its official website rather than replying.
- Be calm and factual, not alarmist — the goal is to inform, not scare.

Respond with ONLY a single JSON object, nothing else:
{
  "verdict": "one sentence",
  "reasons": ["short sentence", "..."],
  "risks": ["short sentence", "..."],
  "nextSteps": ["short sentence", "..."]
}

Do not include any explanation of your reasoning process, any preamble, any markdown code fences, or any text outside the JSON object. If no risks apply, return an empty array for "risks".`;

interface ParsedAiPayload {
  verdict: string;
  reasons: string[];
  risks: string[];
  nextSteps: string[];
}

function isParsedAiPayload(value: unknown): value is ParsedAiPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.verdict === "string" &&
    Array.isArray(v.reasons) &&
    v.reasons.every((r) => typeof r === "string") &&
    Array.isArray(v.risks) &&
    v.risks.every((r) => typeof r === "string") &&
    Array.isArray(v.nextSteps) &&
    v.nextSteps.every((r) => typeof r === "string")
  );
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

/**
 * Generates the beginner-friendly explanation shown in the AI
 * Assistant card. Falls back to a rule-based explanation whenever the
 * API key is missing, the call fails, or the response doesn't parse
 * — the card never shows an error or goes blank. Only indicator
 * category labels are sent to the AI — never the raw email content.
 */
export async function getEmailAiExplanation(
  score: number,
  classification: EmailRiskClassification,
  indicators: EmailIndicator[]
): Promise<AiExplanation> {
  if (!env.ANTHROPIC_API_KEY) {
    return buildFallbackEmailExplanation(indicators, classification);
  }

  try {
    const payload = {
      score,
      classification: EMAIL_CLASSIFICATION_LABELS[classification],
      indicators: indicators.map((indicator) => ({ label: indicator.label, severity: indicator.severity })),
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

    if (!isParsedAiPayload(parsed)) {
      throw new Error("AI response did not match the expected shape");
    }

    return { ...parsed, generatedByAi: true };
  } catch (error) {
    logger.error("Email AI explanation failed — using fallback", { error: String(error) });
    return buildFallbackEmailExplanation(indicators, classification);
  }
}
