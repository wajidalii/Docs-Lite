import 'server-only';
import type { WorkspaceRole } from '@/lib/workspaceAccess';
import { findUserById, findUserByEmail } from '@/server/repositories/userRepo';
import * as repo from '@/server/repositories/workspaceRepo';
import { requireWorkspaceAccess } from './workspace-access-control';
import { workspaceMemberRateLimit } from './rate-limit';

/** User-facing workspace error (invalid target, self-invite, etc.). */
export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

export type { WorkspaceSummary, WorkspaceMemberRow } from '@/server/repositories/workspaceRepo';

/** Create a new workspace. The creator becomes its (implicit) owner. */
export async function createWorkspace(userId: string, name: string): Promise<string> {
  return repo.insertWorkspace(userId, name);
}

/** Workspaces the user owns or belongs to. */
export async function listWorkspacesForUser(userId: string) {
  return repo.listWorkspacesForUser(userId);
}

/** Grant or update membership for the user with `email`. Admin (or owner) only. */
export async function inviteMember(workspaceId: string, actingUserId: string, email: string, role: WorkspaceRole) {
  workspaceMemberRateLimit(actingUserId);
  await requireWorkspaceAccess(workspaceId, actingUserId, 'admin');

  const target = await findUserByEmail(email);
  if (!target) throw new WorkspaceError('No user with that email');
  if (target.id === actingUserId) throw new WorkspaceError('You already own this workspace');

  await repo.upsertMember(workspaceId, target.id, role);
  return repo.listMembers(workspaceId);
}

/** Change an existing member's role. Admin (or owner) only. */
export async function changeMemberRole(
  workspaceId: string,
  actingUserId: string,
  targetUserId: string,
  role: WorkspaceRole,
) {
  workspaceMemberRateLimit(actingUserId);
  await requireWorkspaceAccess(workspaceId, actingUserId, 'admin');
  if (targetUserId === actingUserId) throw new WorkspaceError('You already own this workspace');
  if (!(await findUserById(targetUserId))) throw new WorkspaceError('No user with that id');
  await repo.upsertMember(workspaceId, targetUserId, role);
  return repo.listMembers(workspaceId);
}

/** Remove a member. Admin (or owner) only. */
export async function removeMember(workspaceId: string, actingUserId: string, targetUserId: string) {
  workspaceMemberRateLimit(actingUserId);
  await requireWorkspaceAccess(workspaceId, actingUserId, 'admin');
  await repo.removeMember(workspaceId, targetUserId);
  return repo.listMembers(workspaceId);
}

/** List members. Any member (or owner/admin) may read. */
export async function listMembers(workspaceId: string, actingUserId: string) {
  await requireWorkspaceAccess(workspaceId, actingUserId, 'member');
  return repo.listMembers(workspaceId);
}
