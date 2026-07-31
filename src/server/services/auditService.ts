import 'server-only';
import * as repo from '@/server/repositories/auditRepo';
import type { AuditEventInput } from '@/server/repositories/auditRepo';

// A shared helper other already-authorized services call — NOT a door of its
// own. By the time a service wants to record an event, it has already
// enforced access (e.g. sharingService.shareDocument already ran
// requireDocAccess(docId, actingUserId, 'owner') before anything else), so
// recordAuditEvent does no authorization checking itself.
//
// Deliberately fire-and-forget-ish: a failure writing the audit row must
// never take down the primary action it's describing (a share/login/role
// change succeeding is far more important than its own audit trail) — so
// this swallows and logs rather than throwing back into the caller.
export async function recordAuditEvent(event: AuditEventInput): Promise<void> {
  try {
    await repo.insertAuditEvent(event);
  } catch (err) {
    console.error('[audit] failed to record event', event.action, err);
  }
}

export async function listAuditEventsForTarget(targetType: string, targetId: string) {
  return repo.listAuditEventsForTarget(targetType, targetId);
}
