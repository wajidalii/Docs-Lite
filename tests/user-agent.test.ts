import { describe, it, expect } from 'vitest';
import { summarizeUserAgent } from '@/lib/userAgent';

describe('summarizeUserAgent', () => {
  it('returns "Unknown device" for null', () => {
    expect(summarizeUserAgent(null)).toBe('Unknown device');
  });

  it('identifies Chrome on macOS', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(summarizeUserAgent(ua)).toBe('Chrome on macOS');
  });

  it('identifies Firefox on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
    expect(summarizeUserAgent(ua)).toBe('Firefox on Windows');
  });

  it('identifies Safari on iOS', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(summarizeUserAgent(ua)).toBe('Safari on iOS');
  });

  it('falls back gracefully for an unrecognized string', () => {
    expect(summarizeUserAgent('some-weird-client/1.0')).toBe('Browser on an unknown OS');
  });
});
