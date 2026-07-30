import 'server-only';
import { effectiveRole, meetsRank, type EffectiveRole } from '@/lib/access';
import { getDocAccess } from '@/server/repositories/documentRepo';
import { NotFoundError } from './errors';

export { NotFoundError };

/**
 * The single authorization door. Loads the document's owner + shares, computes
 * the caller's effective role, and throws NotFoundError unless it meets `min`.
 * `userId` must always come from the session — never from client input.
 */
export async function requireDocAccess(
  docId: string,
  userId: string,
  min: EffectiveRole,
): Promise<{ role: EffectiveRole }> {
  const access = await getDocAccess(docId);
  if (!access) throw new NotFoundError();

  const role = effectiveRole(access, userId);
  if (!meetsRank(role, min)) throw new NotFoundError();

  // A soft-deleted document is invisible to everyone except its owner (who
  // needs access to restore it via the trash view).
  if (access.deletedAt && role !== 'owner') throw new NotFoundError();

  return { role: role as EffectiveRole };
}
