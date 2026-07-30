import 'server-only';
import { effectiveWorkspaceRole, meetsWorkspaceRank, type EffectiveWorkspaceRole } from '@/lib/workspaceAccess';
import { getWorkspaceAccess } from '@/server/repositories/workspaceRepo';
import { NotFoundError } from './errors';

/**
 * The single authorization door for workspaces — same contract as
 * requireDocAccess (throws the same generic NotFoundError, no existence
 * leak). `userId` must always come from the session — never from client
 * input. Workspace membership is organizational only; it never gates
 * reading/editing an individual document (that's requireDocAccess).
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
  min: EffectiveWorkspaceRole,
): Promise<{ role: EffectiveWorkspaceRole }> {
  const access = await getWorkspaceAccess(workspaceId);
  if (!access) throw new NotFoundError();

  const role = effectiveWorkspaceRole(access, userId);
  if (!meetsWorkspaceRank(role, min)) throw new NotFoundError();

  return { role: role as EffectiveWorkspaceRole };
}
