import { describe, it, expect, vi, beforeEach } from 'vitest';

const getDocAccess = vi.fn();
const upsertPresence = vi.fn();
const listActiveViewers = vi.fn();

vi.mock('@/server/repositories/documentRepo', () => ({
  getDocAccess: (...args: unknown[]) => getDocAccess(...args),
}));

vi.mock('@/server/repositories/presenceRepo', () => ({
  upsertPresence: (...args: unknown[]) => upsertPresence(...args),
  listActiveViewers: (...args: unknown[]) => listActiveViewers(...args),
}));

const { heartbeat, listViewers, ACTIVE_WINDOW_MS } = await import('@/server/services/presenceService');
const { NotFoundError } = await import('@/server/services/errors');

const DOC = 'doc-1';
const OWNER = 'owner-id';
const VIEWER = 'viewer-id';
const STRANGER = 'stranger-id';

beforeEach(() => {
  getDocAccess.mockReset();
  upsertPresence.mockReset();
  listActiveViewers.mockReset();
});

describe('heartbeat', () => {
  it('denies a stranger with no access to the document', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [] });
    await expect(heartbeat(DOC, STRANGER)).rejects.toBeInstanceOf(NotFoundError);
    expect(upsertPresence).not.toHaveBeenCalled();
  });

  it('records a heartbeat for a viewer', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: VIEWER, role: 'viewer' }] });
    await heartbeat(DOC, VIEWER);
    expect(upsertPresence).toHaveBeenCalledWith(DOC, VIEWER);
  });
});

describe('listViewers', () => {
  it('denies a stranger with no access to the document', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [] });
    await expect(listViewers(DOC, STRANGER)).rejects.toBeInstanceOf(NotFoundError);
    expect(listActiveViewers).not.toHaveBeenCalled();
  });

  it('excludes the caller and uses the active window for a viewer', async () => {
    getDocAccess.mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [{ userId: VIEWER, role: 'viewer' }] });
    listActiveViewers.mockResolvedValue([{ userId: OWNER, name: 'Owner' }]);
    const result = await listViewers(DOC, VIEWER);
    expect(listActiveViewers).toHaveBeenCalledWith(DOC, VIEWER, ACTIVE_WINDOW_MS);
    expect(result).toEqual([{ userId: OWNER, name: 'Owner' }]);
  });
});
