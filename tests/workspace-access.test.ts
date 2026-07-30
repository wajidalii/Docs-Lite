import { describe, it, expect } from 'vitest';
import {
  effectiveWorkspaceRole,
  canCreateDocuments,
  canManageMembers,
  type WorkspaceAccess,
} from '@/lib/workspaceAccess';

const OWNER = 'owner-id';
const MEMBER = 'member-id';
const ADMIN = 'admin-id';
const STRANGER = 'stranger-id';
const REMOVED = 'removed-id';

// A workspace owned by OWNER, with MEMBER as member and ADMIN as admin.
// REMOVED once had access but their member row was removed (so they are absent).
const ws: WorkspaceAccess = {
  ownerId: OWNER,
  members: [
    { userId: MEMBER, role: 'member' },
    { userId: ADMIN, role: 'admin' },
  ],
};

describe('effectiveWorkspaceRole', () => {
  it('is "owner" for the owner', () => {
    expect(effectiveWorkspaceRole(ws, OWNER)).toBe('owner');
  });
  it('is the member role for members', () => {
    expect(effectiveWorkspaceRole(ws, MEMBER)).toBe('member');
    expect(effectiveWorkspaceRole(ws, ADMIN)).toBe('admin');
  });
  it('is null for a non-owner, non-member user', () => {
    expect(effectiveWorkspaceRole(ws, STRANGER)).toBeNull();
  });
  it('is null for a removed (absent) user', () => {
    expect(effectiveWorkspaceRole(ws, REMOVED)).toBeNull();
  });
});

describe('workspace access-control matrix', () => {
  it('owner can create documents and manage members', () => {
    expect(canCreateDocuments(ws, OWNER)).toBe(true);
    expect(canManageMembers(ws, OWNER)).toBe(true);
  });

  it('member can create documents but NOT manage members', () => {
    expect(canCreateDocuments(ws, MEMBER)).toBe(true);
    expect(canManageMembers(ws, MEMBER)).toBe(false);
  });

  it('admin can create documents and manage members', () => {
    expect(canCreateDocuments(ws, ADMIN)).toBe(true);
    expect(canManageMembers(ws, ADMIN)).toBe(true);
  });

  it('a non-member stranger is denied everything (no IDOR)', () => {
    expect(canCreateDocuments(ws, STRANGER)).toBe(false);
    expect(canManageMembers(ws, STRANGER)).toBe(false);
  });

  it('a removed member is denied everything', () => {
    expect(canCreateDocuments(ws, REMOVED)).toBe(false);
    expect(canManageMembers(ws, REMOVED)).toBe(false);
  });
});
