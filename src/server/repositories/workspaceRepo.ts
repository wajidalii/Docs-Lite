import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { workspaces, workspaceMembers, users } from '@/server/db/schema';
import type { WorkspaceRole } from '@/lib/workspaceAccess';

// Pure data access. Repositories never make authorization decisions — the
// service layer does that via requireWorkspaceAccess before calling here.

export type WorkspaceAccessRow = { ownerId: string; members: { userId: string; role: WorkspaceRole }[] };
export type WorkspaceSummary = { id: string; name: string; role: 'owner' | WorkspaceRole };
export type WorkspaceMemberRow = { userId: string; name: string; email: string; role: WorkspaceRole };

export async function insertWorkspace(ownerId: string, name: string): Promise<string> {
  const [row] = await db.insert(workspaces).values({ ownerId, name }).returning({ id: workspaces.id });
  return row.id;
}

/** Owner id + all member rows, used to compute effective role. */
export async function getWorkspaceAccess(id: string): Promise<WorkspaceAccessRow | null> {
  const [ws] = await db.select({ ownerId: workspaces.ownerId }).from(workspaces).where(eq(workspaces.id, id));
  if (!ws) return null;
  const members = await db
    .select({ userId: workspaceMembers.userId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, id));
  return { ownerId: ws.ownerId, members: members.map((m) => ({ userId: m.userId, role: m.role as WorkspaceRole })) };
}

/** Workspaces the user owns or is a member of, oldest first (personal workspace, created at signup, sorts first). */
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const owned = await db
    .select({ id: workspaces.id, name: workspaces.name, createdAt: workspaces.createdAt })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId));

  const memberOf = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      createdAt: workspaces.createdAt,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));

  const combined = [
    ...owned.map((w) => ({ ...w, role: 'owner' as const })),
    ...memberOf.map((w) => ({ ...w, role: w.role as WorkspaceRole })),
  ];
  combined.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return combined.map(({ id, name, role }) => ({ id, name, role }));
}

export async function upsertMember(workspaceId: string, targetUserId: string, role: WorkspaceRole) {
  await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId: targetUserId, role })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: { role },
    });
}

export async function removeMember(workspaceId: string, targetUserId: string) {
  await db
    .delete(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)));
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMemberRow[]> {
  const rows = await db
    .select({ userId: users.id, name: users.name, email: users.email, role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(users.name));
  return rows.map((r) => ({ ...r, role: r.role as WorkspaceRole }));
}
