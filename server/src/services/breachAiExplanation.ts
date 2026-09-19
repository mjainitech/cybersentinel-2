import { env } from "../config/env";
import { logger } from "./logger";
import { buildFallbackBreachExplanation } from "./breachAiExplanationFallback";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { AiExplanation, BreachRecord, ExposureRiskLevel } from "../types";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const AI_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a cybersecurity assistant explaining data breach exposure results to a complete beginner. You are given a SUMMARY of breach findings for an email address — never the email address itself, never any passwords.

You will receive: whether any breaches were found, how many, the risk level, and for each breach: its name, approximate date, and which categories of data it exposed (e.g. "email", "password", "phone").

Write a beginner-friendly explanation covering:
1. What happened, in one clear sentence.
2. What information may have been exposed, referencing only the categories provided.
3. Why this matters — including how password reuse (credential stuffing) and phishing risk connect to a breach, when relevant.
4. What the person should do next, including whether MFA would help.

Style rules:
- Simple, calm, factual language — no alarmist or fear-based wording.
- Never invent specific breach details beyond what's provided.
- If no breaches were found, clearly state that this does NOT guarantee the account was never exposed — it only means no matching record was found in the database checked.
- Never claim certainty about a probability of harm.

Respond with ONLY a single JSON object, nothing else:
{
  "verdict": "one sentence",
  "reasons": ["short sentence", "..."],
  "risks": ["short sentence", "..."],
  "recommendations": ["short sentence", "..."]
}

No preamble, no reasoning process, no markdown code fences, no text outside the JSON object. If no risks apply, return an empty array for "risks".`;

interface ParsedAiPayload {
  verdict: string;
  reasons: string[];
  risks: string[];
  recommendations: string[];
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
    Array.isArray(v.recommendations) &&
    v.recommendations.every((r) => typeof r === "string")
  );
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

/** Only a summary (counts, categories, dates) is ever sent to the AI — never the email address, never any password. */
export async function getBreachAiExplanation(
  breaches: BreachRecord[],
  level: ExposureRiskLevel
): Promise<AiExplanation> {
  if (!env.ANTHROPIC_API_KEY) {
    return buildFallbackBreachExplanation(breaches, level);
  }

  try {
    const payload = {
      breachFound: breaches.length > 0,
      breachCount: breaches.length,
      riskLevel: level,
      breaches: breaches.map((b) => ({
        title: b.title,
        breachDate: b.breachDate,
        exposedCategories: b.exposedCategories,
        passwordExposed: b.isPasswordExposed,
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
    if (!isParsedAiPayload(parsed)) throw new Error("AI response did not match the expected shape");

    return { verdict: parsed.verdict, reasons: parsed.reasons, risks: parsed.risks, nextSteps: parsed.recommendations, generatedByAi: true };
  } catch (error) {
    logger.error("Breach AI explanation failed — using fallback", { error: String(error) });
    return buildFallbackBreachExplanation(breaches, level);
  }
}
