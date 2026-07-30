import 'server-only';
import * as repo from '@/server/repositories/imageRepo';
import { NotFoundError, requireDocAccess } from './access-control';

// Business rules + authorization. Every function takes the acting userId (from
// the session, resolved in the route) and authorizes before touching the repo.

export async function uploadImageForDocument(
  docId: string,
  userId: string,
  mimeType: string,
  size: number,
  data: Buffer,
): Promise<string> {
  await requireDocAccess(docId, userId, 'editor');
  return repo.insertImage(docId, mimeType, size, data);
}

export async function getImageForUser(imageId: string, userId: string) {
  const image = await repo.getImageById(imageId);
  if (!image) throw new NotFoundError();
  await requireDocAccess(image.documentId, userId, 'viewer');
  return image;
}
