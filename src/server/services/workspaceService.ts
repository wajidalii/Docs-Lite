import 'server-only';
import type { WorkspaceRole } from '@/lib/workspaceAccess';
import { findUserById, findUserByEmail } from '@/server/repositories/userRepo';
import * as repo from '@/server/repositories/workspaceRepo';
import { requireWorkspaceAccess } from './workspace-access-control';
import { NotFoundError } from './errors';
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

/** A single workspace's details, for its settings page. Any member (or owner/admin) may read. */
export async function getWorkspaceForUser(workspaceId: string, userId: string) {
  const { role } = await requireWorkspaceAccess(workspaceId, userId, 'member');
  const workspace = await repo.getWorkspaceById(workspaceId);
  if (!workspace) throw new NotFoundError();
  return { workspace, role };
}

/** Rename a workspace. Admin (or owner) only. */
export async function renameWorkspace(workspaceId: string, actingUserId: string, name: string) {
  await requireWorkspaceAccess(workspaceId, actingUserId, 'admin');
  await repo.renameWorkspace(workspaceId, name);
}

/**
 * Leave a workspace voluntarily. The owner can't leave their own workspace
 * (there's nothing to transfer to). An admin can't leave if they're the last
 * admin — someone besides the owner needs to keep being able to manage
 * membership.
 */
export async function leaveWorkspace(workspaceId: string, userId: string) {
  const { role } = await requireWorkspaceAccess(workspaceId, userId, 'member');
  if (role === 'owner') throw new WorkspaceError('Workspace owners cannot leave their own workspace.');

  if (role === 'admin') {
    const members = await repo.listMembers(workspaceId);
    const otherAdmins = members.filter((m) => m.role === 'admin' && m.userId !== userId);
    if (otherAdmins.length === 0) {
      throw new WorkspaceError('You are the last admin — promote another member to admin before leaving.');
    }
  }

  await repo.removeMember(workspaceId, userId);
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
