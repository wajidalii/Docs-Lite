import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock both repos so these business-rule tests run under plain `npm test`
// without the Dockerized Postgres the integration suite needs.
const getDocAccess = vi.fn();
const getDocumentById = vi.fn();
const updateContent = vi.fn();
const getLatestVersionTime = vi.fn();
const insertVersion = vi.fn();
const getVersionById = vi.fn();
const listVersions = vi.fn();

vi.mock('@/server/repositories/documentRepo', () => ({
  getDocAccess: (...args: unknown[]) => getDocAccess(...args),
  getDocumentById: (...args: unknown[]) => getDocumentById(...args),
  updateContent: (...args: unknown[]) => updateContent(...args),
}));

vi.mock('@/server/repositories/versionRepo', () => ({
  getLatestVersionTime: (...args: unknown[]) => getLatestVersionTime(...args),
  insertVersion: (...args: unknown[]) => insertVersion(...args),
  getVersionById: (...args: unknown[]) => getVersionById(...args),
  listVersions: (...args: unknown[]) => listVersions(...args),
}));

// documentService.ts imports requireWorkspaceAccess (for createDocument),
// which transitively imports workspaceRepo -> the DB client -> env
// validation. Not exercised by the functions under test here, but the
// import chain still needs a mock so this file runs under plain `npm test`.
vi.mock('@/server/repositories/workspaceRepo', () => ({
  getWorkspaceAccess: vi.fn(),
}));

const { saveDocumentContent } = await import('@/server/services/documentService');
const { restoreVersionForUser, listVersionsForUser } = await import('@/server/services/versionService');
const { NotFoundError } = await import('@/server/services/access-control');

const OWNER = 'owner-id';
const DOC = 'doc-1';

beforeEach(() => {
  getDocAccess.mockReset().mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [] });
  getDocumentById.mockReset();
  updateContent.mockReset();
  getLatestVersionTime.mockReset();
  insertVersion.mockReset().mockResolvedValue('version-id');
  getVersionById.mockReset();
  listVersions.mockReset();
});

describe('saveDocumentContent — periodic version snapshot', () => {
  it('snapshots on the very first save (no prior version)', async () => {
    getLatestVersionTime.mockResolvedValue(null);
    await saveDocumentContent(DOC, OWNER, { type: 'doc' });
    expect(insertVersion).toHaveBeenCalledWith(DOC, OWNER, { type: 'doc' });
  });

  it('skips the snapshot when the last one is within the interval', async () => {
    getLatestVersionTime.mockResolvedValue(new Date(Date.now() - 30_000)); // 30s ago
    await saveDocumentContent(DOC, OWNER, { type: 'doc' });
    expect(insertVersion).not.toHaveBeenCalled();
    expect(updateContent).toHaveBeenCalledWith(DOC, { type: 'doc' }, ''); // the actual save still happens
  });

  it('snapshots again once the interval has elapsed', async () => {
    getLatestVersionTime.mockResolvedValue(new Date(Date.now() - 6 * 60_000)); // 6 min ago
    await saveDocumentContent(DOC, OWNER, { type: 'doc' });
    expect(insertVersion).toHaveBeenCalledWith(DOC, OWNER, { type: 'doc' });
  });
});

describe('restoreVersionForUser', () => {
  it('throws NotFoundError when the version does not belong to the document (no cross-doc restore)', async () => {
    getVersionById.mockResolvedValue(null);
    await expect(restoreVersionForUser(DOC, OWNER, 'other-docs-version')).rejects.toThrow(NotFoundError);
    expect(updateContent).not.toHaveBeenCalled();
  });

  it('snapshots the current content before applying the restored one', async () => {
    getVersionById.mockResolvedValue({ id: 'v1', documentId: DOC, content: { type: 'doc', old: true } });
    getDocumentById.mockResolvedValue({ id: DOC, content: { type: 'doc', current: true } });

    await restoreVersionForUser(DOC, OWNER, 'v1');

    expect(insertVersion).toHaveBeenCalledWith(DOC, OWNER, { type: 'doc', current: true });
    expect(updateContent).toHaveBeenCalledWith(DOC, { type: 'doc', old: true }, '');
  });

  it('denies a shared viewer (below editor rank)', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: 'viewer-id', role: 'viewer' }] });
    await expect(restoreVersionForUser(DOC, 'viewer-id', 'v1')).rejects.toThrow(NotFoundError);
  });
});

describe('listVersionsForUser', () => {
  it('denies a non-shared stranger', async () => {
    await expect(listVersionsForUser(DOC, 'stranger-id')).rejects.toThrow(NotFoundError);
  });

  it('returns the repo listing for an authorized viewer', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: 'viewer-id', role: 'viewer' }] });
    listVersions.mockResolvedValue([{ id: 'v1', createdAt: new Date(), authorName: 'Alice' }]);
    await expect(listVersionsForUser(DOC, 'viewer-id')).resolves.toEqual([
      { id: 'v1', createdAt: expect.any(Date), authorName: 'Alice' },
    ]);
  });
});
