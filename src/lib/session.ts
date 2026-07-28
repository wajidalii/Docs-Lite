import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import { env } from '@/lib/env';
import { findUserById } from '@/server/repositories/userRepo';

export type SessionData = { userId?: string };
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
 * The currently signed-in user, or null. Identity is read ONLY from the signed
 * cookie — never a param/header/body. Memoized per-request via React cache().
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await findUserById(session.userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
});

/** Same as getCurrentUser but throws when unauthenticated (for actions). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
