import { describe, it, expect, vi, beforeEach } from 'vitest';

// requireDocAccess is the DAL's one door (tdd.md §9, §10 row #2). It's tested
// here against a mocked repo so the acceptance criterion runs under plain
// `npm test`, without needing the Dockerized Postgres that the integration
// suite (tests/integration/*) exercises it through.
const getDocAccess = vi.fn();

vi.mock('@/server/repositories/documentRepo', () => ({
  getDocAccess: (...args: unknown[]) => getDocAccess(...args),
}));

const { requireDocAccess, NotFoundError } = await import('@/server/services/access-control');

const OWNER = 'owner-id';
const VIEWER = 'viewer-id';
const EDITOR = 'editor-id';
const STRANGER = 'stranger-id';

beforeEach(() => {
  getDocAccess.mockReset();
});

describe('requireDocAccess', () => {
  it('throws NotFoundError when the document does not exist', async () => {
    getDocAccess.mockResolvedValue(null);
    await expect(requireDocAccess('doc-1', OWNER, 'viewer')).rejects.toThrow(NotFoundError);
  });

  it('resolves for the owner at every minRole', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, shares: [] });
    await expect(requireDocAccess('doc-1', OWNER, 'viewer')).resolves.toEqual({ role: 'owner' });
    await expect(requireDocAccess('doc-1', OWNER, 'editor')).resolves.toEqual({ role: 'owner' });
    await expect(requireDocAccess('doc-1', OWNER, 'owner')).resolves.toEqual({ role: 'owner' });
  });

  it('allows a shared viewer at minRole viewer but denies write/manage', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, shares: [{ userId: VIEWER, role: 'viewer' }] });
    await expect(requireDocAccess('doc-1', VIEWER, 'viewer')).resolves.toEqual({ role: 'viewer' });
    await expect(requireDocAccess('doc-1', VIEWER, 'editor')).rejects.toThrow(NotFoundError);
    await expect(requireDocAccess('doc-1', VIEWER, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('allows a shared editor at minRole editor but denies manage', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, shares: [{ userId: EDITOR, role: 'editor' }] });
    await expect(requireDocAccess('doc-1', EDITOR, 'viewer')).resolves.toEqual({ role: 'editor' });
    await expect(requireDocAccess('doc-1', EDITOR, 'editor')).resolves.toEqual({ role: 'editor' });
    await expect(requireDocAccess('doc-1', EDITOR, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('denies a non-owner, non-shared stranger at every minRole (no IDOR)', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, shares: [{ userId: VIEWER, role: 'viewer' }] });
    await expect(requireDocAccess('doc-1', STRANGER, 'viewer')).rejects.toThrow(NotFoundError);
    await expect(requireDocAccess('doc-1', STRANGER, 'editor')).rejects.toThrow(NotFoundError);
    await expect(requireDocAccess('doc-1', STRANGER, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('denies a revoked user (share row removed) at every minRole', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, shares: [] });
    await expect(requireDocAccess('doc-1', VIEWER, 'viewer')).rejects.toThrow(NotFoundError);
  });
});
