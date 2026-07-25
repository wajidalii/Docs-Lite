import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documentShares, users } from '@/server/db/schema';
import type { Role } from '@/lib/access';

export type Collaborator = { userId: string; name: string; email: string; role: Role };

export async function listShares(docId: string): Promise<Collaborator[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: documentShares.role,
    })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.sharedWithUserId))
    .where(eq(documentShares.documentId, docId));
  return rows.map((r) => ({ ...r, role: r.role as Role }));
}

export async function upsertShare(docId: string, targetUserId: string, role: Role) {
  await db
    .insert(documentShares)
    .values({ documentId: docId, sharedWithUserId: targetUserId, role })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.sharedWithUserId],
      set: { role },
    });
}

export async function removeShare(docId: string, targetUserId: string) {
  await db
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, docId), eq(documentShares.sharedWithUserId, targetUserId)));
}
