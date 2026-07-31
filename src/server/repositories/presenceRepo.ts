import 'server-only';
import { and, eq, gte, ne } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documentPresence, users } from '@/server/db/schema';

export type ActiveViewer = { userId: string; name: string };

export async function upsertPresence(documentId: string, userId: string) {
  await db
    .insert(documentPresence)
    .values({ documentId, userId })
    .onConflictDoUpdate({
      target: [documentPresence.documentId, documentPresence.userId],
      set: { lastSeenAt: new Date() },
    });
}

/** Other users who've heartbeated this document within the last `sinceMs`. */
export async function listActiveViewers(
  documentId: string,
  excludeUserId: string,
  sinceMs: number,
): Promise<ActiveViewer[]> {
  const cutoff = new Date(Date.now() - sinceMs);
  const rows = await db
    .select({ userId: users.id, name: users.name })
    .from(documentPresence)
    .innerJoin(users, eq(users.id, documentPresence.userId))
    .where(
      and(
        eq(documentPresence.documentId, documentId),
        ne(documentPresence.userId, excludeUserId),
        gte(documentPresence.lastSeenAt, cutoff),
      ),
    );
  return rows;
}
