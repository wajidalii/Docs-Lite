import 'server-only';

// Neon can terminate an idle backend out from under a pooled connection
// (compute auto-suspend, connection recycling — Postgres error 57P01
// "admin_shutdown", or a plain socket reset). node-postgres surfaces this as
// a rejected query on whichever request happened to be holding that dead
// client; the pool discards it and hands the next caller a fresh connection.
// A single retry is enough — this is a transient transport blip, not a
// query-correctness problem — so callers on the hot autosave/upload paths
// don't need to surface it to the user as a failed save.
const RETRYABLE_CODES = new Set(['57P01', 'ECONNRESET', 'ETIMEDOUT']);

export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const code = (err as { code?: string } | undefined)?.code;
    if (!code || !RETRYABLE_CODES.has(code)) throw err;
    return fn();
  }
}
