// Pure access-control logic — no DB, no I/O, no framework. This is the single
// source of truth for "who can do what" and the target of the meaningful test.
// The server DAL is a thin adapter that loads {ownerId, shares} and calls these.

export type Role = 'viewer' | 'editor';
export type EffectiveRole = 'owner' | Role;

export type DocAccess = {
  ownerId: string;
  shares: { userId: string; role: Role }[];
};

// Higher number = more privilege. Every operation maps to a minimum required rank.
const RANK: Record<EffectiveRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

/** The user's effective role on a document, or null if they have no access. */
export function effectiveRole(doc: DocAccess, userId: string): EffectiveRole | null {
  if (doc.ownerId === userId) return 'owner';
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

/** True if `role` meets or exceeds the minimum required rank. Null role = denied. */
export function meetsRank(role: EffectiveRole | null, min: EffectiveRole): boolean {
  if (role === null) return false;
  return RANK[role] >= RANK[min];
}

/** Read a document / list collaborators. Owner, editor, or viewer. */
export function canView(doc: DocAccess, userId: string): boolean {
  return meetsRank(effectiveRole(doc, userId), 'viewer');
}

/** Edit document content. Owner or editor. */
export function canEdit(doc: DocAccess, userId: string): boolean {
  return meetsRank(effectiveRole(doc, userId), 'editor');
}

/** Rename / share / change-role / revoke / delete. Owner only. */
export function canManage(doc: DocAccess, userId: string): boolean {
  return meetsRank(effectiveRole(doc, userId), 'owner');
}
