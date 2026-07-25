'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { zEmail, zRole, zUuid } from '@/lib/validation';
import * as svc from '@/server/services/sharingService';
import { ShareError, type Collaborator } from '@/server/services/sharingService';
import { NotFoundError } from '@/server/services/access-control';

export type ShareResult = { ok: true; collaborators: Collaborator[] } | { ok: false; error: string };

function handleError(err: unknown): ShareResult {
  if (err instanceof ShareError) return { ok: false, error: err.message };
  if (err instanceof NotFoundError) return { ok: false, error: 'Document not found' };
  throw err;
}

export async function shareDoc(id: string, email: string, role: string): Promise<ShareResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(id);
  const pemail = zEmail.safeParse(email);
  const prole = zRole.safeParse(role);
  if (!pid.success) return { ok: false, error: 'Invalid document' };
  if (!pemail.success) return { ok: false, error: 'Enter a valid email address' };
  if (!prole.success) return { ok: false, error: 'Invalid role' };

  try {
    const collaborators = await svc.shareDocument(pid.data, user.id, pemail.data, prole.data);
    revalidatePath('/');
    revalidatePath(`/documents/${pid.data}`);
    return { ok: true, collaborators };
  } catch (err) {
    return handleError(err);
  }
}

export async function changeRole(id: string, targetUserId: string, role: string): Promise<ShareResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(id);
  const puser = zUuid.safeParse(targetUserId);
  const prole = zRole.safeParse(role);
  if (!pid.success || !puser.success) return { ok: false, error: 'Invalid request' };
  if (!prole.success) return { ok: false, error: 'Invalid role' };

  try {
    const collaborators = await svc.changeRole(pid.data, user.id, puser.data, prole.data);
    revalidatePath('/');
    revalidatePath(`/documents/${pid.data}`);
    return { ok: true, collaborators };
  } catch (err) {
    return handleError(err);
  }
}

export async function revokeShare(id: string, targetUserId: string): Promise<ShareResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(id);
  const puser = zUuid.safeParse(targetUserId);
  if (!pid.success || !puser.success) return { ok: false, error: 'Invalid request' };

  try {
    const collaborators = await svc.revokeShare(pid.data, user.id, puser.data);
    revalidatePath('/');
    revalidatePath(`/documents/${pid.data}`);
    return { ok: true, collaborators };
  } catch (err) {
    return handleError(err);
  }
}

export async function listCollaborators(id: string): Promise<ShareResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(id);
  if (!pid.success) return { ok: false, error: 'Invalid document' };
  try {
    const collaborators = await svc.listCollaborators(pid.data, user.id);
    return { ok: true, collaborators };
  } catch (err) {
    return handleError(err);
  }
}
