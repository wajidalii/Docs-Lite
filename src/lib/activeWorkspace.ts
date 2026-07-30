import 'server-only';
import { cookies } from 'next/headers';
import { listWorkspacesForUser } from '@/server/services/workspaceService';
import { requireWorkspaceAccess } from '@/server/services/workspace-access-control';

export const ACTIVE_WORKSPACE_COOKIE = 'docs_active_workspace';

/**
 * The workspace document creation / the dashboard's "My documents" list
 * should scope to: the `docs_active_workspace` cookie if set AND the caller
 * is still a member, otherwise the caller's oldest (personal) workspace.
 * The cookie is never trusted blindly — membership is always re-verified
 * server-side here, same "never trust client input" posture as identity
 * being read only from the signed session cookie (src/lib/session.ts).
 */
export async function resolveActiveWorkspaceId(userId: string): Promise<string> {
  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (requested) {
    try {
      await requireWorkspaceAccess(requested, userId, 'member');
      return requested;
    } catch {
      // Stale, invalid, or revoked — fall through to the default below.
    }
  }

  const mine = await listWorkspacesForUser(userId);
  if (mine.length === 0) throw new Error('User has no workspace — every signup should create one');
  return mine[0].id;
}

/** Not a secret — just which workspace tab is selected, so it's plain (not httpOnly) and long-lived. */
export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
