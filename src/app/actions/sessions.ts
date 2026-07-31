'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser, getSession } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import * as svc from '@/server/services/sessionService';
import type { SessionRow } from '@/server/db/schema';

export type ListSessionsResult = { ok: true; sessions: SessionRow[]; currentSessionId: string | null };
export type RevokeSessionResult = { ok: true } | { ok: false; error: string };

export async function listMySessions(): Promise<ListSessionsResult> {
  const user = await requireUser();
  const session = await getSession();
  const sessions = await svc.listSessionsForUser(user.id);
  return { ok: true, sessions, currentSessionId: session.sessionId ?? null };
}

export async function revokeSession(sessionId: string): Promise<RevokeSessionResult> {
  const user = await requireUser();
  const parsed = zUuid.safeParse(sessionId);
  if (!parsed.success) return { ok: false, error: 'Invalid session id' };

  await svc.revokeSession(parsed.data, user.id);
  revalidatePath('/settings/sessions');
  return { ok: true };
}

export async function signOutAllDevices() {
  const user = await requireUser();
  await svc.signOutAllDevices(user.id);
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
