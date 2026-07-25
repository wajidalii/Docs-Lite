import 'server-only';
import { effectiveRole, meetsRank, type EffectiveRole } from '@/lib/access';
import { getDocAccess } from '@/server/repositories/documentRepo';

/** Thrown on any denied or missing document. Generic on purpose (no existence leak). */
export class NotFoundError extends Error {
  constructor() {
    super('Not found');
    this.name = 'NotFoundError';
  }
}

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

  return { role: role as EffectiveRole };
}
