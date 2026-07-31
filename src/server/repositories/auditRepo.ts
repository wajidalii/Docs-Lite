import 'server-only';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLog } from '@/server/db/schema';

export type AuditEventInput = {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: unknown;
};

export async function insertAuditEvent(event: AuditEventInput): Promise<void> {
  await db.insert(auditLog).values({
    actorId: event.actorId,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    metadata: event.metadata,
  });
}

/** History for one target (e.g. a document's share activity), newest first. */
export async function listAuditEventsForTarget(targetType: string, targetId: string) {
  return db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, targetType), eq(auditLog.targetId, targetId)))
    .orderBy(desc(auditLog.createdAt));
}
