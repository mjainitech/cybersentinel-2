import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}

/**
 * Simple in-memory TTL cache keyed by normalized URL. Good enough for
 * a single-instance deployment; swap the internals for Redis (same
 * get/set/has interface) if this ever runs across multiple instances.
 */
export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {
    // Periodically sweep expired entries so memory doesn't grow unbounded.
    setInterval(() => this.sweep(), Math.min(ttlMs, 60_000)).unref?.();
  }

  get(key: string): { value: T; cachedAt: number } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return { value: entry.value, cachedAt: entry.cachedAt };
  }

  set(key: string, value: T): void {
    const now = Date.now();
    this.store.set(key, { value, expiresAt: now + this.ttlMs, cachedAt: now });
  }

  private sweep() {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.info("Cache sweep removed expired entries", { removed, remaining: this.store.size });
    }
  }
}
