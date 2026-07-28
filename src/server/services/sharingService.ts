import 'server-only';
import type { Role } from '@/lib/access';
import { getSeededUser, getSeededUserByEmail } from '@/lib/users';
import * as shareRepo from '@/server/repositories/shareRepo';
import { requireDocAccess } from './access-control';

/** User-facing sharing error (invalid target, self-share, etc.). */
export class ShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShareError';
  }
}

export type { Collaborator } from '@/server/repositories/shareRepo';

/** Grant or update access for the user with `email`. Owner only. */
export async function shareDocument(docId: string, actingUserId: string, email: string, role: Role) {
  await requireDocAccess(docId, actingUserId, 'owner');

  const target = getSeededUserByEmail(email);
  if (!target) throw new ShareError('No user with that email');
  if (target.id === actingUserId) throw new ShareError('You already own this document');

  await shareRepo.upsertShare(docId, target.id, role);
  return shareRepo.listShares(docId);
}

/** Change an existing collaborator's role. Owner only. */
export async function changeRole(docId: string, actingUserId: string, targetUserId: string, role: Role) {
  await requireDocAccess(docId, actingUserId, 'owner');
  if (targetUserId === actingUserId) throw new ShareError('You already own this document');
  if (!getSeededUser(targetUserId)) throw new ShareError('No user with that id');
  await shareRepo.upsertShare(docId, targetUserId, role);
  return shareRepo.listShares(docId);
}

/** Remove a collaborator. Owner only. */
export async function revokeShare(docId: string, actingUserId: string, targetUserId: string) {
  await requireDocAccess(docId, actingUserId, 'owner');
  await shareRepo.removeShare(docId, targetUserId);
  return shareRepo.listShares(docId);
}

/** List collaborators. Any viewer+ may read. */
export async function listCollaborators(docId: string, actingUserId: string) {
  await requireDocAccess(docId, actingUserId, 'viewer');
  return shareRepo.listShares(docId);
}
