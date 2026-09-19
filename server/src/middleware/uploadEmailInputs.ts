import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const storage = multer.memoryStorage();
const IMAGE_ONLY_ERROR = "IMAGE_ONLY";
const ALLOWED_SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

/**
 * A single multipart request can carry a "screenshot" (the input
 * method itself, when the user chooses to upload an image of the
 * email) and/or an "attachment" (metadata about a file that came
 * attached to the email being analyzed — we only ever read its name/
 * type/size, never its content; see controllers/emailController.ts).
 */
function fileFilter(_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (file.fieldname === "screenshot" && !ALLOWED_SCREENSHOT_TYPES.has(file.mimetype)) {
    return callback(new Error(IMAGE_ONLY_ERROR));
  }
  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 2,
  },
}).fields([
  { name: "screenshot", maxCount: 1 },
  { name: "attachment", maxCount: 1 },
]);

export function uploadEmailInputs(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: `That file is too large. Please keep uploads under ${env.RESUME_MAX_FILE_SIZE_MB}MB.` });
      }
      return res.status(400).json({ error: "Something went wrong uploading that file. Please try again." });
    }

    if (error instanceof Error && error.message === IMAGE_ONLY_ERROR) {
      return res.status(400).json({ error: "Please upload a PNG, JPEG, or WebP image as the screenshot." });
    }

    return res.status(400).json({ error: "Something went wrong uploading that file. Please try again." });
  });
}
