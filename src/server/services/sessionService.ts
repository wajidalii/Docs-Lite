import 'server-only';
import * as repo from '@/server/repositories/sessionRepo';

// Business rules. Every function takes the acting userId (from the session,
// resolved in the action) — a caller can only ever see/revoke their own
// sessions, enforced by scoping every repo query to that userId.

export async function listSessionsForUser(userId: string) {
  return repo.listSessionsForUser(userId);
}

/** Revoke one session. Scoped to the caller — deleteSessionForUser's WHERE
 * clause matches on (id AND userId), so this can never touch another user's
 * session even if the id is guessed. */
export async function revokeSession(sessionId: string, userId: string) {
  await repo.deleteSessionForUser(sessionId, userId);
}

/** "Sign out all devices" — revokes every session for the user, including the caller's own. */
export async function signOutAllDevices(userId: string) {
  await repo.deleteAllSessionsForUser(userId);
}
