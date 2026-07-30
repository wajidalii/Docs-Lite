import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as workspaces from '@/server/services/workspaceService';
import { WorkspaceError } from '@/server/services/workspaceService';
import { NotFoundError } from '@/server/services/errors';
import { closeDb } from '@/server/db/client';

// Seeded users (see src/lib/users.ts + scripts/seed.ts).
const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const ALICE_EMAIL = 'alice@docslite.dev';
const BOB_EMAIL = 'bob@docslite.dev';

let workspaceId: string;

describe('workspace flow (integration — real Postgres)', () => {
  beforeAll(async () => {
    workspaceId = await workspaces.createWorkspace(ALICE, 'Test Workspace');
  });

  it('Alice owns the workspace she created', async () => {
    const mine = await workspaces.listWorkspacesForUser(ALICE);
    expect(mine.some((w) => w.id === workspaceId && w.role === 'owner')).toBe(true);
  });

  it('inviting Bob as a member lets him read the member list but not manage it', async () => {
    const members = await workspaces.inviteMember(workspaceId, ALICE, BOB_EMAIL, 'member');
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId: BOB, role: 'member' });

    const bobWorkspaces = await workspaces.listWorkspacesForUser(BOB);
    expect(bobWorkspaces.some((w) => w.id === workspaceId && w.role === 'member')).toBe(true);

    await expect(workspaces.listMembers(workspaceId, BOB)).resolves.toEqual(members);
    await expect(workspaces.inviteMember(workspaceId, BOB, 'carol@docslite.dev', 'member')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('promoting Bob to admin lets him manage members', async () => {
    await workspaces.changeMemberRole(workspaceId, ALICE, BOB, 'admin');
    const members = await workspaces.inviteMember(workspaceId, BOB, 'carol@docslite.dev', 'member');
    expect(members.some((m) => m.role === 'member' && m.userId !== BOB)).toBe(true);
  });

  it('re-inviting changes the role instead of duplicating (upsert)', async () => {
    const members = await workspaces.inviteMember(workspaceId, ALICE, BOB_EMAIL, 'member');
    expect(members.filter((m) => m.userId === BOB)).toHaveLength(1);
    expect(members.find((m) => m.userId === BOB)?.role).toBe('member');
  });

  it('removing a member revokes access', async () => {
    const members = await workspaces.removeMember(workspaceId, ALICE, BOB);
    expect(members.some((m) => m.userId === BOB)).toBe(false);
    const bobWorkspaces = await workspaces.listWorkspacesForUser(BOB);
    expect(bobWorkspaces.some((w) => w.id === workspaceId)).toBe(false);
  });

  it('rejects inviting an unknown email', async () => {
    await expect(workspaces.inviteMember(workspaceId, ALICE, 'nobody@nowhere.dev', 'member')).rejects.toBeInstanceOf(
      WorkspaceError,
    );
  });

  it('rejects inviting yourself (the owner)', async () => {
    await expect(workspaces.inviteMember(workspaceId, ALICE, ALICE_EMAIL, 'member')).rejects.toBeInstanceOf(
      WorkspaceError,
    );
  });

  it('a non-admin member cannot invite (admin-only)', async () => {
    await workspaces.inviteMember(workspaceId, ALICE, BOB_EMAIL, 'member');
    await expect(workspaces.inviteMember(workspaceId, BOB, 'dave@docslite.dev', 'member')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  afterAll(async () => {
    await closeDb();
  });
});
