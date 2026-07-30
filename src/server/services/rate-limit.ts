import 'server-only';

/** Thrown when a caller exceeds their quota. Generic message — no internals leaked. */
export class RateLimitError extends Error {
  constructor() {
    super('Too many requests. Please slow down and try again shortly.');
    this.name = 'RateLimitError';
  }
}

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Creates an independent in-memory fixed-window rate limiter keyed by an
 * arbitrary string (the acting user's id). Each limiter owns its own bucket
 * map, so different actions never share or exhaust each other's quota.
 *
 * In-memory and per-process: fine for the current single-instance deploy
 * target (tdd.md §13.B). Would need a shared store (e.g. Redis/Upstash) if
 * this ever runs behind multiple server instances.
 */
export function createRateLimiter(rule: RateLimitRule) {
  const buckets = new Map<string, Bucket>();

  return function enforce(key: string): void {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      return;
    }

    if (bucket.count >= rule.limit) {
      throw new RateLimitError();
    }

    bucket.count += 1;
  };
}

// Per-action limiters. Kept in one place so thresholds are easy to audit/tune.
export const shareRateLimit = createRateLimiter({ limit: 20, windowMs: 60_000 });
export const uploadRateLimit = createRateLimiter({ limit: 10, windowMs: 60_000 });
export const imageUploadRateLimit = createRateLimiter({ limit: 20, windowMs: 60_000 });
// Autosave (saveDoc) fires every ~750ms while typing — ~80/min of normal,
// expected traffic. Set well above that so real typing is never blocked,
// while still catching a hammering/buggy client.
export const autosaveRateLimit = createRateLimiter({ limit: 180, windowMs: 60_000 });
