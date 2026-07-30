import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import { getWorkspaceForUser, listMembers } from '@/server/services/workspaceService';
import { findUserById } from '@/server/repositories/userRepo';
import { NotFoundError } from '@/server/services/access-control';
import { WorkspaceSettings } from '@/components/workspace/WorkspaceSettings';

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  if (!zUuid.safeParse(id).success) notFound();

  let data;
  try {
    data = await getWorkspaceForUser(id, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [members, owner] = await Promise.all([listMembers(id, user.id), findUserById(data.workspace.ownerId)]);

  return (
    <WorkspaceSettings
      workspaceId={id}
      name={data.workspace.name}
      role={data.role}
      currentUserId={user.id}
      owner={owner ? { id: owner.id, name: owner.name, email: owner.email } : null}
      members={members}
    />
  );
}
