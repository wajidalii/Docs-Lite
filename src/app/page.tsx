import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { resolveActiveWorkspaceId } from '@/lib/activeWorkspace';
import { listDashboard } from '@/server/services/documentService';
import { listWorkspacesForUser } from '@/server/services/workspaceService';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { timeAgo } from '@/lib/time';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const activeWorkspaceId = await resolveActiveWorkspaceId(user.id);
  const [{ owned, shared }, workspaces] = await Promise.all([
    listDashboard(user.id, activeWorkspaceId),
    listWorkspacesForUser(user.id),
  ]);

  const ownedD = owned.map((d) => ({
    id: d.id,
    title: d.title,
    timeLabel: timeAgo(d.updatedAt),
    role: 'owner' as const,
  }));
  const sharedD = shared.map((d) => ({
    id: d.id,
    title: d.title,
    timeLabel: timeAgo(d.updatedAt),
    role: d.role as 'editor' | 'viewer',
  }));

  return (
    <Dashboard
      user={{ id: user.id, name: user.name, email: user.email }}
      owned={ownedD}
      shared={sharedD}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
    />
  );
}
