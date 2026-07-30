import 'server-only';
import * as repo from '@/server/repositories/documentRepo';
import * as versionRepo from '@/server/repositories/versionRepo';
import { NotFoundError, requireDocAccess } from './access-control';

export type { VersionSummary } from '@/server/repositories/versionRepo';

/** List a document's version history. Any viewer+ may read. */
export async function listVersionsForUser(docId: string, userId: string) {
  await requireDocAccess(docId, userId, 'viewer');
  return versionRepo.listVersions(docId);
}

/**
 * Restore a document to an earlier version. Owner or editor only. Snapshots
 * the document's current content first (unthrottled, unlike the periodic
 * autosave snapshot) so restoring never destroys the state it replaces.
 */
export async function restoreVersionForUser(docId: string, userId: string, versionId: string) {
  await requireDocAccess(docId, userId, 'editor');

  const version = await versionRepo.getVersionById(versionId, docId);
  if (!version) throw new NotFoundError();

  const doc = await repo.getDocumentById(docId);
  if (!doc) throw new NotFoundError();

  await versionRepo.insertVersion(docId, userId, doc.content);
  await repo.updateContent(docId, version.content);
}
