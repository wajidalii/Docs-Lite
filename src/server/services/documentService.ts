import 'server-only';
import { EMPTY_DOC } from '@/lib/editor/empty';
import * as repo from '@/server/repositories/documentRepo';
import { NotFoundError, requireDocAccess } from './access-control';

// Business rules + authorization. Every function takes the acting userId (from
// the session, resolved in the action) and authorizes before touching the repo.

export async function createDocument(userId: string): Promise<string> {
  return repo.insertDocument(userId, 'Untitled', EMPTY_DOC);
}

export async function createDocumentWithContent(
  userId: string,
  title: string,
  content: unknown,
): Promise<string> {
  return repo.insertDocument(userId, title, content);
}

export async function getDocumentForUser(docId: string, userId: string) {
  const { role } = await requireDocAccess(docId, userId, 'viewer');
  const doc = await repo.getDocumentById(docId);
  if (!doc) throw new NotFoundError();
  return { doc, role };
}

export async function renameDocument(docId: string, userId: string, title: string) {
  await requireDocAccess(docId, userId, 'owner');
  await repo.updateTitle(docId, title);
}

export async function saveDocumentContent(docId: string, userId: string, content: unknown) {
  await requireDocAccess(docId, userId, 'editor');
  await repo.updateContent(docId, content);
}

export async function deleteDocumentForUser(docId: string, userId: string) {
  await requireDocAccess(docId, userId, 'owner');
  await repo.deleteDocument(docId);
}

export async function listDashboard(userId: string) {
  const [owned, shared] = await Promise.all([repo.listOwned(userId), repo.listSharedWith(userId)]);
  return { owned, shared };
}
