import type { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";

/**
 * Last-resort error handler. Anything that reaches here is unexpected
 * (every known failure path already resolves to an "unknown" check
 * result upstream) — log it for debugging and respond safely rather
 * than letting Express crash the process.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  logger.error("Unhandled request error", {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
  });

  if (res.headersSent) return;

  res.status(500).json({ error: "Something went wrong while scanning. Please try again." });
}
