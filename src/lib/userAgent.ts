// Minimal heuristic summary of a User-Agent string for display (e.g. "Chrome
// on macOS") — not a full UA parser, just enough to make a sessions list
// readable without pulling in a dependency for it.
export function summarizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Firefox\//.test(userAgent)
          ? 'Firefox'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Browser';

  // iPhone/iPad UAs include "like Mac OS X" for compatibility, so they must
  // be checked before the plain "Mac OS X" (real macOS) pattern.
  const os = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Windows/.test(userAgent)
      ? 'Windows'
      : /Mac OS X/.test(userAgent)
        ? 'macOS'
        : /Android/.test(userAgent)
          ? 'Android'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'an unknown OS';

  return `${browser} on ${os}`;
}
