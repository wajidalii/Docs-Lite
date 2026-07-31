import 'server-only';
import * as repo from '@/server/repositories/presenceRepo';
import { requireDocAccess } from './access-control';

// Presence isn't an access-control boundary of its own — it's gated the
// same way reading the document already is (requireDocAccess), no parallel
// authorization path.

// Client polls on PRESENCE_POLL_MS (Editor's PresenceAvatars component);
// this window is a couple of missed heartbeats' worth of slack so a normal
// polling gap doesn't flicker someone in and out.
export const ACTIVE_WINDOW_MS = 20_000;

export async function heartbeat(docId: string, userId: string) {
  await requireDocAccess(docId, userId, 'viewer');
  await repo.upsertPresence(docId, userId);
}

export async function listViewers(docId: string, userId: string) {
  await requireDocAccess(docId, userId, 'viewer');
  return repo.listActiveViewers(docId, userId, ACTIVE_WINDOW_MS);
}
