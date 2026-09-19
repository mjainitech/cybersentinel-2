import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/**
 * Memory storage — the file buffer only ever exists in RAM for the
 * lifetime of this one request. It's never written to disk, so
 * there's no temp file to clean up and nothing left behind if the
 * process crashes mid-request. See services/pdfTextExtraction.ts,
 * which consumes the buffer directly.
 */
const storage = multer.memoryStorage();

const PDF_ONLY_ERROR = "PDF_ONLY";

function pdfOnlyFilter(_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  const isPdfMimeType = file.mimetype === "application/pdf";
  const isPdfExtension = file.originalname.toLowerCase().endsWith(".pdf");

  if (isPdfMimeType && isPdfExtension) {
    callback(null, true);
  } else {
    callback(new Error(PDF_ONLY_ERROR));
  }
}

const singleResumeUpload = multer({
  storage,
  fileFilter: pdfOnlyFilter,
  limits: {
    fileSize: env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
}).single("resume");

/**
 * Wraps multer's middleware so its errors (file too large, wrong
 * type, no file at all) become friendly 400 responses instead of
 * falling through to the generic 500 error handler.
 */
export function uploadResume(req: Request, res: Response, next: NextFunction) {
  singleResumeUpload(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: `That file is too large. Please upload a PDF under ${env.RESUME_MAX_FILE_SIZE_MB}MB.` });
      }
      return res.status(400).json({ error: "Something went wrong uploading that file. Please try again." });
    }

    if (error instanceof Error && error.message === PDF_ONLY_ERROR) {
      return res.status(400).json({ error: "Please upload a PDF file — other formats aren't supported yet." });
    }

    return res.status(400).json({ error: "Something went wrong uploading that file. Please try again." });
  });
}
