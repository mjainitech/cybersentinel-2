import { createWorker } from "tesseract.js";
import { logger } from "./logger";

export interface OcrResult {
  ok: boolean;
  text: string;
  lowText: boolean;
  error?: string;
}

const LOW_TEXT_THRESHOLD = 40;
const OCR_TIMEOUT_MS = 20_000;

/**
 * Runs OCR on an uploaded screenshot to recover the email's text.
 * This is genuinely lower-accuracy than pasted text or a real email
 * file — OCR struggles with small fonts, low-resolution screenshots,
 * and unusual layouts. If it comes back with too little text, the
 * caller shows a clear warning and suggests pasting the text instead,
 * rather than silently analyzing a near-empty result.
 */
export async function extractTextFromScreenshot(buffer: Buffer): Promise<OcrResult> {
  const worker = await createWorker("eng");

  try {
    const result = await Promise.race([
      worker.recognize(buffer),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("OCR_TIMEOUT")), OCR_TIMEOUT_MS)),
    ]);

    const text = result.data.text.trim();

    if (text.length < LOW_TEXT_THRESHOLD) {
      return { ok: true, text, lowText: true };
    }

    return { ok: true, text, lowText: false };
  } catch (error) {
    logger.error("Screenshot OCR failed", { error: String(error) });
    return {
      ok: false,
      text: "",
      lowText: false,
      error: "Couldn't read text from this image. Try a clearer screenshot, or paste the email text directly instead.",
    };
  } finally {
    await worker.terminate().catch(() => undefined);
  }
}
