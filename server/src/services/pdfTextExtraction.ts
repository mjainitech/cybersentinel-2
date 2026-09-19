import pdfParse from "pdf-parse";
import { logger } from "./logger";

export interface ExtractionResult {
  ok: boolean;
  text: string;
  /** True when extraction "succeeded" but returned almost no text — usually a scanned/image-only PDF with no real text layer. */
  lowText: boolean;
  error?: string;
}

/** Below this many characters, a "successful" extraction is treated as effectively empty. */
const LOW_TEXT_THRESHOLD = 40;

/**
 * Extracts text from a PDF buffer. Takes the file as an in-memory
 * Buffer (see middleware/uploadResume.ts, which uses multer's memory
 * storage) — the file is never written to disk, so there's nothing
 * to clean up afterward and nothing left on disk if the process crashes.
 */
export async function extractResumeText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await pdfParse(buffer);
    const text = result.text.trim();

    if (text.length < LOW_TEXT_THRESHOLD) {
      return {
        ok: true,
        text,
        lowText: true,
      };
    }

    return { ok: true, text, lowText: false };
  } catch (error) {
    logger.error("PDF text extraction failed", { error: String(error) });
    return {
      ok: false,
      text: "",
      lowText: false,
      error: "Couldn't read this PDF. It may be corrupted, password-protected, or not a real PDF file.",
    };
  }
}
