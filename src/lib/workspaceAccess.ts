// Pure access-control logic for workspaces — no DB, no I/O, no framework.
// Same shape as src/lib/access.ts (documents): the server DAL is a thin
// adapter that loads {ownerId, members} and calls these. Workspace
// membership is organizational only — it never gates reading/editing an
// individual document (that's still requireDocAccess, unaffected).

export type WorkspaceRole = 'member' | 'admin';
export type EffectiveWorkspaceRole = 'owner' | WorkspaceRole;

export type WorkspaceAccess = {
  ownerId: string;
  members: { userId: string; role: WorkspaceRole }[];
};

// Higher number = more privilege. Every operation maps to a minimum required rank.
const RANK: Record<EffectiveWorkspaceRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

/** The user's effective role in a workspace, or null if they have no access. */
export function effectiveWorkspaceRole(ws: WorkspaceAccess, userId: string): EffectiveWorkspaceRole | null {
  if (ws.ownerId === userId) return 'owner';
  const member = ws.members.find((m) => m.userId === userId);
  return member ? member.role : null;
}

/** True if `role` meets or exceeds the minimum required rank. Null role = denied. */
export function meetsWorkspaceRank(role: EffectiveWorkspaceRole | null, min: EffectiveWorkspaceRole): boolean {
  if (role === null) return false;
  return RANK[role] >= RANK[min];
}

/** Create documents in the workspace. Owner, admin, or member. */
export function canCreateDocuments(ws: WorkspaceAccess, userId: string): boolean {
  return meetsWorkspaceRank(effectiveWorkspaceRole(ws, userId), 'member');
}

/** Invite / remove / change-role members. Owner or admin. */
export function canManageMembers(ws: WorkspaceAccess, userId: string): boolean {
  return meetsWorkspaceRank(effectiveWorkspaceRole(ws, userId), 'admin');
}
