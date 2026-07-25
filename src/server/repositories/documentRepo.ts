import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documents, documentShares } from '@/server/db/schema';
import type { Role } from '@/lib/access';

// Pure data access. Repositories never make authorization decisions — the
// service layer does that via requireDocAccess before calling here.

export type DocAccessRow = { ownerId: string; shares: { userId: string; role: Role }[] };

export async function insertDocument(ownerId: string, title: string, content: unknown): Promise<string> {
  const [row] = await db
    .insert(documents)
    .values({ ownerId, title, content })
    .returning({ id: documents.id });
  return row.id;
}

export async function getDocumentById(id: string) {
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  return row ?? null;
}

/** Owner id + all share rows, used to compute effective role. */
export async function getDocAccess(id: string): Promise<DocAccessRow | null> {
  const [doc] = await db.select({ ownerId: documents.ownerId }).from(documents).where(eq(documents.id, id));
  if (!doc) return null;
  const shares = await db
    .select({ userId: documentShares.sharedWithUserId, role: documentShares.role })
    .from(documentShares)
    .where(eq(documentShares.documentId, id));
  return { ownerId: doc.ownerId, shares: shares.map((s) => ({ userId: s.userId, role: s.role as Role })) };
}

export async function listOwned(userId: string) {
  return db
    .select({ id: documents.id, title: documents.title, updatedAt: documents.updatedAt })
    .from(documents)
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));
}

export async function listSharedWith(userId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      role: documentShares.role,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .where(eq(documentShares.sharedWithUserId, userId))
    .orderBy(desc(documents.updatedAt));
}

export async function updateTitle(id: string, title: string) {
  await db.update(documents).set({ title, updatedAt: new Date() }).where(eq(documents.id, id));
}

export async function updateContent(id: string, content: unknown) {
  await db.update(documents).set({ content, updatedAt: new Date() }).where(eq(documents.id, id));
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}
