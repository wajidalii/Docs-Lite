'use server';

import { redirect } from 'next/navigation';
import { getSession, establishSession } from '@/lib/session';
import { zSignUpInput, zSignInInput } from '@/lib/validation';
import { signUpUser, signInUser, AuthError } from '@/server/services/authService';
import { deleteSessionForUser } from '@/server/repositories/sessionRepo';

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  const parsed = zSignUpInput.safeParse({ email, password, name });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  let user;
  try {
    user = await signUpUser(parsed.data.email, parsed.data.password, parsed.data.name);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const session = await getSession();
  session.userId = user.id;
  await establishSession(session, user.id);
  await session.save();
  redirect('/');
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const parsed = zSignInInput.safeParse({ email, password });
  if (!parsed.success) return { ok: false, error: 'Enter a valid email and password' };

  let user;
  try {
    user = await signInUser(parsed.data.email, parsed.data.password);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const session = await getSession();
  session.userId = user.id;
  await establishSession(session, user.id);
  await session.save();
  redirect('/');
}

export async function signOut() {
  const session = await getSession();
  if (session.userId && session.sessionId) {
    await deleteSessionForUser(session.sessionId, session.userId);
  }
  session.destroy();
  redirect('/login');
}
