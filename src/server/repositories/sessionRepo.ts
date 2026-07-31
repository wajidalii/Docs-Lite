import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { sessions } from '@/server/db/schema';

// Pure data access. Repositories never make authorization decisions — the
// service layer does that before calling here.

export async function insertSession(userId: string, userAgent: string | null): Promise<string> {
  const [row] = await db.insert(sessions).values({ userId, userAgent }).returning({ id: sessions.id });
  return row.id;
}

/** True if the session row still exists (i.e. hasn't been revoked). */
export async function sessionExists(id: string): Promise<boolean> {
  const [row] = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.id, id));
  return !!row;
}

export async function touchSession(id: string): Promise<void> {
  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id));
}

export async function listSessionsForUser(userId: string) {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.lastSeenAt));
}

/** Deletes the session only if it belongs to `userId` — the access-control-sensitive part. */
export async function deleteSessionForUser(id: string, userId: string): Promise<void> {
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
