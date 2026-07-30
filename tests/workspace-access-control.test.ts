import { describe, it, expect, vi, beforeEach } from 'vitest';

// requireWorkspaceAccess is the workspace DAL's one door, same contract as
// requireDocAccess (tests/access-control.test.ts). Tested here against a
// mocked repo so it runs under plain `npm test`, without needing the
// Dockerized Postgres the integration suite exercises it through.
const getWorkspaceAccess = vi.fn();

vi.mock('@/server/repositories/workspaceRepo', () => ({
  getWorkspaceAccess: (...args: unknown[]) => getWorkspaceAccess(...args),
}));

const { requireWorkspaceAccess } = await import('@/server/services/workspace-access-control');
const { NotFoundError } = await import('@/server/services/errors');

const OWNER = 'owner-id';
const MEMBER = 'member-id';
const ADMIN = 'admin-id';
const STRANGER = 'stranger-id';

beforeEach(() => {
  getWorkspaceAccess.mockReset();
});

describe('requireWorkspaceAccess', () => {
  it('throws NotFoundError when the workspace does not exist', async () => {
    getWorkspaceAccess.mockResolvedValue(null);
    await expect(requireWorkspaceAccess('ws-1', OWNER, 'member')).rejects.toThrow(NotFoundError);
  });

  it('resolves for the owner at every minRole', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [] });
    await expect(requireWorkspaceAccess('ws-1', OWNER, 'member')).resolves.toEqual({ role: 'owner' });
    await expect(requireWorkspaceAccess('ws-1', OWNER, 'admin')).resolves.toEqual({ role: 'owner' });
    await expect(requireWorkspaceAccess('ws-1', OWNER, 'owner')).resolves.toEqual({ role: 'owner' });
  });

  it('allows a member at minRole member but denies admin/manage', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: MEMBER, role: 'member' }] });
    await expect(requireWorkspaceAccess('ws-1', MEMBER, 'member')).resolves.toEqual({ role: 'member' });
    await expect(requireWorkspaceAccess('ws-1', MEMBER, 'admin')).rejects.toThrow(NotFoundError);
    await expect(requireWorkspaceAccess('ws-1', MEMBER, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('allows an admin at minRole admin but denies owner-only', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: ADMIN, role: 'admin' }] });
    await expect(requireWorkspaceAccess('ws-1', ADMIN, 'member')).resolves.toEqual({ role: 'admin' });
    await expect(requireWorkspaceAccess('ws-1', ADMIN, 'admin')).resolves.toEqual({ role: 'admin' });
    await expect(requireWorkspaceAccess('ws-1', ADMIN, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('denies a non-owner, non-member stranger at every minRole (no IDOR)', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: MEMBER, role: 'member' }] });
    await expect(requireWorkspaceAccess('ws-1', STRANGER, 'member')).rejects.toThrow(NotFoundError);
    await expect(requireWorkspaceAccess('ws-1', STRANGER, 'admin')).rejects.toThrow(NotFoundError);
    await expect(requireWorkspaceAccess('ws-1', STRANGER, 'owner')).rejects.toThrow(NotFoundError);
  });

  it('denies a removed member (member row gone) at every minRole', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [] });
    await expect(requireWorkspaceAccess('ws-1', MEMBER, 'member')).rejects.toThrow(NotFoundError);
  });
});
