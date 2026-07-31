import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock both repos so this business-rule test runs under plain `npm test`
// without the Dockerized Postgres the integration suite needs.
const getDocAccess = vi.fn();
const getDocumentById = vi.fn();
const insertDocument = vi.fn();
const getWorkspaceAccess = vi.fn();

vi.mock('@/server/repositories/documentRepo', () => ({
  getDocAccess: (...args: unknown[]) => getDocAccess(...args),
  getDocumentById: (...args: unknown[]) => getDocumentById(...args),
  insertDocument: (...args: unknown[]) => insertDocument(...args),
}));

vi.mock('@/server/repositories/workspaceRepo', () => ({
  getWorkspaceAccess: (...args: unknown[]) => getWorkspaceAccess(...args),
}));

// documentService.ts also imports versionRepo (for saveDocumentContent's
// snapshot check) — not exercised here, but the import chain still needs a
// mock so this file runs under plain `npm test` (same DB-client-at-module-
// scope issue every new service test this session has hit).
vi.mock('@/server/repositories/versionRepo', () => ({
  getLatestVersionTime: vi.fn(),
  insertVersion: vi.fn(),
}));

const { duplicateDocumentForUser } = await import('@/server/services/documentService');
const { NotFoundError } = await import('@/server/services/errors');

const OWNER = 'owner-id';
const VIEWER = 'viewer-id';
const STRANGER = 'stranger-id';
const DOC = 'doc-1';
const WORKSPACE = 'ws-1';

beforeEach(() => {
  getDocAccess.mockReset();
  getDocumentById.mockReset();
  insertDocument.mockReset().mockResolvedValue('new-doc-id');
  getWorkspaceAccess.mockReset().mockResolvedValue({ ownerId: OWNER, members: [{ userId: VIEWER, role: 'member' }] });
});

describe('duplicateDocumentForUser', () => {
  it('denies a stranger with no access to the source document', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [] });
    await expect(duplicateDocumentForUser(DOC, STRANGER, WORKSPACE)).rejects.toBeInstanceOf(NotFoundError);
    expect(insertDocument).not.toHaveBeenCalled();
  });

  it('denies a viewer who is not a member of the target workspace', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: VIEWER, role: 'viewer' }] });
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [] }); // VIEWER not a member here
    await expect(duplicateDocumentForUser(DOC, VIEWER, WORKSPACE)).rejects.toBeInstanceOf(NotFoundError);
    expect(insertDocument).not.toHaveBeenCalled();
  });

  it('clones the source content with a "(copy)" title suffix into the target workspace', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: VIEWER, role: 'viewer' }] });
    const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] };
    getDocumentById.mockResolvedValue({ id: DOC, title: 'Original', content, ownerId: OWNER, workspaceId: 'other-ws' });

    const newId = await duplicateDocumentForUser(DOC, VIEWER, WORKSPACE);

    expect(newId).toBe('new-doc-id');
    expect(insertDocument).toHaveBeenCalledWith(VIEWER, WORKSPACE, 'Original (copy)', content, 'hello');
  });

  it('throws NotFoundError if the source document vanished between the access check and the fetch', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: VIEWER, role: 'viewer' }] });
    getDocumentById.mockResolvedValue(null);
    await expect(duplicateDocumentForUser(DOC, VIEWER, WORKSPACE)).rejects.toBeInstanceOf(NotFoundError);
    expect(insertDocument).not.toHaveBeenCalled();
  });
});
