import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import { env } from '@/lib/env';
import { findUserById } from '@/server/repositories/userRepo';
import { insertSession, sessionExists, touchSession } from '@/server/repositories/sessionRepo';

export type SessionData = { userId?: string; sessionId?: string };
export type CurrentUser = { id: string; name: string; email: string };

const sessionOptions: SessionOptions = {
  password: env.SESSION_PASSWORD,
  cookieName: 'docs_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Creates a server-side session record and stamps its id onto the (already
 * loaded) iron-session object. Caller still sets `session.userId` and calls
 * `session.save()` themselves afterward, same as before this existed.
 */
export async function establishSession(session: Awaited<ReturnType<typeof getSession>>, userId: string) {
  const headerList = await headers();
  session.sessionId = await insertSession(userId, headerList.get('user-agent'));
}

/**
 * The currently signed-in user, or null. Identity is read ONLY from the signed
 * cookie — never a param/header/body. Memoized per-request via React cache().
 *
 * A cryptographically valid cookie is not enough on its own: `sessionId` must
 * also still have a live row in the `sessions` table. Revoking a session (or
 * "sign out all devices") deletes that row, which invalidates the cookie
 * immediately even though it hasn't expired — the server-side check GitHub
 * issue #34 exists to add.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session.userId || !session.sessionId) return null;

  const stillValid = await sessionExists(session.sessionId);
  if (!stillValid) {
    session.destroy();
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) return null;

  await touchSession(session.sessionId);
  return { id: user.id, name: user.name, email: user.email };
});

/** Same as getCurrentUser but throws when unauthenticated (for actions). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
