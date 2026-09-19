import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function extractUserId(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;

  const token = header.slice("Bearer ".length);
  const result = verifyToken(token, env.JWT_SECRET);
  return result?.userId;
}

/** Attaches req.userId if a valid token is present, but never rejects the request — used where login is optional (e.g. scanning as a guest). */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  req.userId = extractUserId(req);
  next();
}

/** Rejects with 401 if there's no valid session — used for routes that require an account (scan history). */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }
  req.userId = userId;
  next();
}
