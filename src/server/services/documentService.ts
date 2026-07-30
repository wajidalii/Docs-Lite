import 'server-only';
import { EMPTY_DOC } from '@/lib/editor/empty';
import * as repo from '@/server/repositories/documentRepo';
import * as versionRepo from '@/server/repositories/versionRepo';
import { NotFoundError, requireDocAccess } from './access-control';
import { autosaveRateLimit } from './rate-limit';

// Business rules + authorization. Every function takes the acting userId (from
// the session, resolved in the action) and authorizes before touching the repo.

// Coarser than the ~750ms autosave debounce (Editor.tsx) on purpose, so a
// typing session gets a handful of checkpoints instead of one row per save.
const VERSION_SNAPSHOT_INTERVAL_MS = 5 * 60_000;

async function maybeSnapshotVersion(docId: string, userId: string, content: unknown) {
  const lastSnapshotAt = await versionRepo.getLatestVersionTime(docId);
  if (lastSnapshotAt && Date.now() - lastSnapshotAt.getTime() < VERSION_SNAPSHOT_INTERVAL_MS) return;
  await versionRepo.insertVersion(docId, userId, content);
}

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
  autosaveRateLimit(userId);
  await requireDocAccess(docId, userId, 'editor');
  // Run concurrently, not sequentially — the periodic snapshot check must
  // never add latency to the autosave debounce's critical path.
  await Promise.all([repo.updateContent(docId, content), maybeSnapshotVersion(docId, userId, content)]);
}

export async function deleteDocumentForUser(docId: string, userId: string) {
  await requireDocAccess(docId, userId, 'owner');
  await repo.softDeleteDocument(docId);
}

export async function restoreDocumentForUser(docId: string, userId: string) {
  // requireDocAccess exempts the owner from the soft-deleted-is-not-found
  // rule, so this resolves even while the doc is still in the trash.
  await requireDocAccess(docId, userId, 'owner');
  await repo.restoreDocument(docId);
}

export async function listDashboard(userId: string) {
  const [owned, shared] = await Promise.all([repo.listOwned(userId), repo.listSharedWith(userId)]);
  return { owned, shared };
}

export async function listTrashForUser(userId: string) {
  return repo.listTrash(userId);
}
