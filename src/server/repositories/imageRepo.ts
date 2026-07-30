import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { documentImages } from '@/server/db/schema';

// Pure data access. Repositories never make authorization decisions — the
// service layer does that via requireDocAccess before calling here.

export async function insertImage(
  documentId: string,
  mimeType: string,
  size: number,
  data: Buffer,
): Promise<string> {
  const [row] = await db
    .insert(documentImages)
    .values({ documentId, mimeType, size, data })
    .returning({ id: documentImages.id });
  return row.id;
}

export async function getImageById(id: string) {
  const [row] = await db.select().from(documentImages).where(eq(documentImages.id, id));
  return row ?? null;
}
