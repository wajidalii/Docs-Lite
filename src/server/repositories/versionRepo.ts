import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documentVersions, users } from '@/server/db/schema';

export type VersionSummary = { id: string; createdAt: Date; authorName: string };

export async function insertVersion(documentId: string, createdBy: string, content: unknown): Promise<string> {
  const [row] = await db
    .insert(documentVersions)
    .values({ documentId, createdBy, content })
    .returning({ id: documentVersions.id });
  return row.id;
}

/** Timestamp of the most recent snapshot for a document, or null if none exist. */
export async function getLatestVersionTime(documentId: string): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: documentVersions.createdAt })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}

export async function listVersions(documentId: string): Promise<VersionSummary[]> {
  const rows = await db
    .select({ id: documentVersions.id, createdAt: documentVersions.createdAt, authorName: users.name })
    .from(documentVersions)
    .innerJoin(users, eq(users.id, documentVersions.createdBy))
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt));
  return rows;
}

export async function getVersionById(id: string, documentId: string) {
  const [row] = await db
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.id, id), eq(documentVersions.documentId, documentId)));
  return row ?? null;
}
