import { describe, it, expect } from 'vitest';
import { effectiveRole, canView, canEdit, canManage, type DocAccess } from '@/lib/access';

const OWNER = 'owner-id';
const VIEWER = 'viewer-id';
const EDITOR = 'editor-id';
const STRANGER = 'stranger-id';
const REVOKED = 'revoked-id';

// A document owned by OWNER, shared as viewer with VIEWER and editor with EDITOR.
// REVOKED once had access but their share row was removed (so they are absent).
const doc: DocAccess = {
  ownerId: OWNER,
  shares: [
    { userId: VIEWER, role: 'viewer' },
    { userId: EDITOR, role: 'editor' },
  ],
};

describe('effectiveRole', () => {
  it('is "owner" for the owner', () => {
    expect(effectiveRole(doc, OWNER)).toBe('owner');
  });
  it('is the shared role for collaborators', () => {
    expect(effectiveRole(doc, VIEWER)).toBe('viewer');
    expect(effectiveRole(doc, EDITOR)).toBe('editor');
  });
  it('is null for a non-owner, non-shared user', () => {
    expect(effectiveRole(doc, STRANGER)).toBeNull();
  });
  it('is null for a revoked (absent) user', () => {
    expect(effectiveRole(doc, REVOKED)).toBeNull();
  });
});

describe('access-control matrix (the core security invariant)', () => {
  it('owner can view, edit, and manage', () => {
    expect(canView(doc, OWNER)).toBe(true);
    expect(canEdit(doc, OWNER)).toBe(true);
    expect(canManage(doc, OWNER)).toBe(true);
  });

  it('shared viewer can view but NOT edit or manage', () => {
    expect(canView(doc, VIEWER)).toBe(true);
    expect(canEdit(doc, VIEWER)).toBe(false);
    expect(canManage(doc, VIEWER)).toBe(false);
  });

  it('shared editor can view and edit but NOT manage', () => {
    expect(canView(doc, EDITOR)).toBe(true);
    expect(canEdit(doc, EDITOR)).toBe(true);
    expect(canManage(doc, EDITOR)).toBe(false);
  });

  it('a non-shared stranger is denied everything (no IDOR)', () => {
    expect(canView(doc, STRANGER)).toBe(false);
    expect(canEdit(doc, STRANGER)).toBe(false);
    expect(canManage(doc, STRANGER)).toBe(false);
  });

  it('a revoked user is denied everything', () => {
    expect(canView(doc, REVOKED)).toBe(false);
    expect(canEdit(doc, REVOKED)).toBe(false);
    expect(canManage(doc, REVOKED)).toBe(false);
  });
});
