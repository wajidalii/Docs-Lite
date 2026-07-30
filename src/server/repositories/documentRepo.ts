import 'server-only';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documents, documentShares } from '@/server/db/schema';
import type { Role } from '@/lib/access';

// Pure data access. Repositories never make authorization decisions — the
// service layer does that via requireDocAccess before calling here.

export type DocAccessRow = { ownerId: string; deletedAt: Date | null; shares: { userId: string; role: Role }[] };

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

/** Owner id + deleted state + all share rows, used to compute effective role. */
export async function getDocAccess(id: string): Promise<DocAccessRow | null> {
  const [doc] = await db
    .select({ ownerId: documents.ownerId, deletedAt: documents.deletedAt })
    .from(documents)
    .where(eq(documents.id, id));
  if (!doc) return null;
  const shares = await db
    .select({ userId: documentShares.sharedWithUserId, role: documentShares.role })
    .from(documentShares)
    .where(eq(documentShares.documentId, id));
  return {
    ownerId: doc.ownerId,
    deletedAt: doc.deletedAt,
    shares: shares.map((s) => ({ userId: s.userId, role: s.role as Role })),
  };
}

export async function listOwned(userId: string) {
  return db
    .select({ id: documents.id, title: documents.title, updatedAt: documents.updatedAt })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), isNull(documents.deletedAt)))
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
    .where(and(eq(documentShares.sharedWithUserId, userId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt));
}

export async function listTrash(userId: string) {
  return db
    .select({ id: documents.id, title: documents.title, deletedAt: documents.deletedAt })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), isNotNull(documents.deletedAt)))
    .orderBy(desc(documents.deletedAt));
}

export async function updateTitle(id: string, title: string) {
  await db.update(documents).set({ title, updatedAt: new Date() }).where(eq(documents.id, id));
}

export async function updateContent(id: string, content: unknown) {
  await db.update(documents).set({ content, updatedAt: new Date() }).where(eq(documents.id, id));
}

export async function softDeleteDocument(id: string) {
  await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, id));
}

export async function restoreDocument(id: string) {
  await db.update(documents).set({ deletedAt: null, updatedAt: new Date() }).where(eq(documents.id, id));
}
