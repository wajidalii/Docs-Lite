import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter, RateLimitError } from '@/server/services/rate-limit';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows calls under the limit', () => {
    const enforce = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(() => enforce('user-1')).not.toThrow();
    expect(() => enforce('user-1')).not.toThrow();
    expect(() => enforce('user-1')).not.toThrow();
  });

  it('throws RateLimitError once the limit is exceeded within the window', () => {
    const enforce = createRateLimiter({ limit: 2, windowMs: 60_000 });
    enforce('user-1');
    enforce('user-1');
    expect(() => enforce('user-1')).toThrow(RateLimitError);
  });

  it('resets the count once the window elapses', () => {
    const enforce = createRateLimiter({ limit: 1, windowMs: 1000 });
    enforce('user-1');
    expect(() => enforce('user-1')).toThrow(RateLimitError);

    vi.advanceTimersByTime(1000);

    expect(() => enforce('user-1')).not.toThrow();
  });

  it('tracks separate keys independently', () => {
    const enforce = createRateLimiter({ limit: 1, windowMs: 60_000 });
    enforce('user-1');
    expect(() => enforce('user-1')).toThrow(RateLimitError);
    expect(() => enforce('user-2')).not.toThrow();
  });

  it('does not let one limiter instance share state with another', () => {
    const enforceA = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const enforceB = createRateLimiter({ limit: 1, windowMs: 60_000 });
    enforceA('user-1');
    expect(() => enforceA('user-1')).toThrow(RateLimitError);
    expect(() => enforceB('user-1')).not.toThrow();
  });
});
