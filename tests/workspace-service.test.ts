import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repo so these business-rule tests run under plain `npm test`
// without the Dockerized Postgres the integration suite needs.
const getWorkspaceAccess = vi.fn();
const getWorkspaceById = vi.fn();
const renameWorkspace = vi.fn();
const removeMember = vi.fn();
const listMembers = vi.fn();

vi.mock('@/server/repositories/workspaceRepo', () => ({
  getWorkspaceAccess: (...args: unknown[]) => getWorkspaceAccess(...args),
  getWorkspaceById: (...args: unknown[]) => getWorkspaceById(...args),
  renameWorkspace: (...args: unknown[]) => renameWorkspace(...args),
  removeMember: (...args: unknown[]) => removeMember(...args),
  listMembers: (...args: unknown[]) => listMembers(...args),
}));

// workspaceService.ts imports findUserById/findUserByEmail (used by
// inviteMember/changeMemberRole, not exercised by the tests in this file) —
// mocked so the import chain doesn't need a real DB client/env.
vi.mock('@/server/repositories/userRepo', () => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
}));

const { renameWorkspace: renameWorkspaceSvc, leaveWorkspace, WorkspaceError } = await import(
  '@/server/services/workspaceService'
);
const { NotFoundError } = await import('@/server/services/errors');

const WS = 'ws-1';
const OWNER = 'owner-id';
const ADMIN = 'admin-id';
const OTHER_ADMIN = 'other-admin-id';
const MEMBER = 'member-id';

beforeEach(() => {
  getWorkspaceAccess.mockReset();
  getWorkspaceById.mockReset();
  renameWorkspace.mockReset();
  removeMember.mockReset();
  listMembers.mockReset();
});

describe('renameWorkspace', () => {
  it('denies a non-admin member', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: MEMBER, role: 'member' }] });
    await expect(renameWorkspaceSvc(WS, MEMBER, 'New name')).rejects.toThrow(NotFoundError);
    expect(renameWorkspace).not.toHaveBeenCalled();
  });

  it('allows an admin to rename', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: ADMIN, role: 'admin' }] });
    await renameWorkspaceSvc(WS, ADMIN, 'New name');
    expect(renameWorkspace).toHaveBeenCalledWith(WS, 'New name');
  });
});

describe('leaveWorkspace', () => {
  it('the owner cannot leave their own workspace', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [] });
    await expect(leaveWorkspace(WS, OWNER)).rejects.toBeInstanceOf(WorkspaceError);
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('a plain member can always leave', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: MEMBER, role: 'member' }] });
    await leaveWorkspace(WS, MEMBER);
    expect(removeMember).toHaveBeenCalledWith(WS, MEMBER);
  });

  it('an admin cannot leave if they are the last admin', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [{ userId: ADMIN, role: 'admin' }] });
    listMembers.mockResolvedValue([{ userId: ADMIN, name: 'Admin', email: 'a@x.dev', role: 'admin' }]);
    await expect(leaveWorkspace(WS, ADMIN)).rejects.toBeInstanceOf(WorkspaceError);
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('an admin can leave when another admin remains', async () => {
    getWorkspaceAccess.mockResolvedValue({
      ownerId: OWNER,
      members: [
        { userId: ADMIN, role: 'admin' },
        { userId: OTHER_ADMIN, role: 'admin' },
      ],
    });
    listMembers.mockResolvedValue([
      { userId: ADMIN, name: 'Admin', email: 'a@x.dev', role: 'admin' },
      { userId: OTHER_ADMIN, name: 'Other', email: 'o@x.dev', role: 'admin' },
    ]);
    await leaveWorkspace(WS, ADMIN);
    expect(removeMember).toHaveBeenCalledWith(WS, ADMIN);
  });

  it('denies a stranger (not a member) via requireWorkspaceAccess', async () => {
    getWorkspaceAccess.mockResolvedValue({ ownerId: OWNER, members: [] });
    await expect(leaveWorkspace(WS, 'stranger-id')).rejects.toBeInstanceOf(NotFoundError);
  });
});
