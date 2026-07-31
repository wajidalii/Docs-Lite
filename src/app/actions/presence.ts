'use server';

import { requireUser } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import * as svc from '@/server/services/presenceService';
import { NotFoundError } from '@/server/services/access-control';
import type { ActiveViewer } from '@/server/repositories/presenceRepo';

export type ListPresenceResult = { ok: true; viewers: ActiveViewer[] } | { ok: false; error: string };

function notFoundResult() {
  return { ok: false as const, error: 'Document not found' };
}

/** Marks the caller as currently viewing the document. Fire-and-forget from the client. */
export async function heartbeatPresence(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false };

  try {
    await svc.heartbeat(parsedId.data, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) return { ok: false };
    throw err;
  }
  return { ok: true };
}

export async function listPresence(id: string): Promise<ListPresenceResult> {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'Invalid document id' };

  try {
    const viewers = await svc.listViewers(parsedId.data, user.id);
    return { ok: true, viewers };
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    throw err;
  }
}
