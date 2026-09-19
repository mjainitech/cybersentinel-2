import type { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

/**
 * A minimal fixed-window rate limiter, in-memory. Good enough for a
 * single-instance deployment (consistent with this project's other
 * in-memory stores) — swap for a shared store (Redis) if this ever
 * runs across multiple instances. Keyed by authenticated user id when
 * available, falling back to IP for guests.
 */
export function rateLimit(options: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = req.userId ?? req.ip ?? "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (entry.count >= options.max) {
      return res.status(429).json({ error: options.message });
    }

    entry.count++;
    next();
  };
}
