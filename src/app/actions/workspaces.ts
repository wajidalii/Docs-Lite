'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { setActiveWorkspaceCookie } from '@/lib/activeWorkspace';
import { zEmail, zUuid, zWorkspaceName, zWorkspaceRole } from '@/lib/validation';
import * as svc from '@/server/services/workspaceService';
import { WorkspaceError, type WorkspaceMemberRow } from '@/server/services/workspaceService';
import { requireWorkspaceAccess } from '@/server/services/workspace-access-control';
import { NotFoundError } from '@/server/services/access-control';
import { RateLimitError } from '@/server/services/rate-limit';

export type WorkspaceMembersResult = { ok: true; members: WorkspaceMemberRow[] } | { ok: false; error: string };
export type CreateWorkspaceResult = { ok: true; id: string } | { ok: false; error: string };
export type SetActiveWorkspaceResult = { ok: true } | { ok: false; error: string };

function handleError(err: unknown): WorkspaceMembersResult {
  if (err instanceof WorkspaceError) return { ok: false, error: err.message };
  if (err instanceof NotFoundError) return { ok: false, error: 'Workspace not found' };
  if (err instanceof RateLimitError) return { ok: false, error: err.message };
  throw err;
}

export async function createWorkspace(name: string): Promise<CreateWorkspaceResult> {
  const user = await requireUser();
  const pname = zWorkspaceName.safeParse(name);
  if (!pname.success) return { ok: false, error: pname.error.issues[0].message };

  const id = await svc.createWorkspace(user.id, pname.data);
  revalidatePath('/');
  return { ok: true, id };
}

export async function listMyWorkspaces() {
  const user = await requireUser();
  return svc.listWorkspacesForUser(user.id);
}

export async function inviteMember(workspaceId: string, email: string, role: string): Promise<WorkspaceMembersResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(workspaceId);
  const pemail = zEmail.safeParse(email);
  const prole = zWorkspaceRole.safeParse(role);
  if (!pid.success) return { ok: false, error: 'Invalid workspace' };
  if (!pemail.success) return { ok: false, error: 'Enter a valid email address' };
  if (!prole.success) return { ok: false, error: 'Invalid role' };

  try {
    const members = await svc.inviteMember(pid.data, user.id, pemail.data, prole.data);
    revalidatePath('/');
    return { ok: true, members };
  } catch (err) {
    return handleError(err);
  }
}

export async function changeMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: string,
): Promise<WorkspaceMembersResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(workspaceId);
  const puser = zUuid.safeParse(targetUserId);
  const prole = zWorkspaceRole.safeParse(role);
  if (!pid.success || !puser.success) return { ok: false, error: 'Invalid request' };
  if (!prole.success) return { ok: false, error: 'Invalid role' };

  try {
    const members = await svc.changeMemberRole(pid.data, user.id, puser.data, prole.data);
    revalidatePath('/');
    return { ok: true, members };
  } catch (err) {
    return handleError(err);
  }
}

export async function removeMember(workspaceId: string, targetUserId: string): Promise<WorkspaceMembersResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(workspaceId);
  const puser = zUuid.safeParse(targetUserId);
  if (!pid.success || !puser.success) return { ok: false, error: 'Invalid request' };

  try {
    const members = await svc.removeMember(pid.data, user.id, puser.data);
    revalidatePath('/');
    return { ok: true, members };
  } catch (err) {
    return handleError(err);
  }
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMembersResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(workspaceId);
  if (!pid.success) return { ok: false, error: 'Invalid workspace' };
  try {
    const members = await svc.listMembers(pid.data, user.id);
    return { ok: true, members };
  } catch (err) {
    return handleError(err);
  }
}

/** Which workspace the dashboard/createDoc/upload use — see src/lib/activeWorkspace.ts. */
export async function setActiveWorkspace(workspaceId: string): Promise<SetActiveWorkspaceResult> {
  const user = await requireUser();
  const pid = zUuid.safeParse(workspaceId);
  if (!pid.success) return { ok: false, error: 'Invalid workspace' };

  try {
    await requireWorkspaceAccess(pid.data, user.id, 'member');
  } catch (err) {
    if (err instanceof NotFoundError) return { ok: false, error: 'Workspace not found' };
    throw err;
  }

  await setActiveWorkspaceCookie(pid.data);
  revalidatePath('/');
  return { ok: true };
}
