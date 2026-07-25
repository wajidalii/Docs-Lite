import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import { env } from '@/lib/env';
import { getSeededUser, type SeededUser } from '@/lib/users';

export type SessionData = { userId?: string };

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
 * The currently signed-in user, or null. Identity is read ONLY from the signed
 * cookie — never a param/header/body. Memoized per-request via React cache().
 */
export const getCurrentUser = cache(async (): Promise<SeededUser | null> => {
  const session = await getSession();
  if (!session.userId) return null;
  return getSeededUser(session.userId) ?? null;
});

/** Same as getCurrentUser but throws when unauthenticated (for actions). */
export async function requireUser(): Promise<SeededUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
