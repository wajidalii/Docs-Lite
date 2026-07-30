import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { listDashboard } from '@/server/services/documentService';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { timeAgo } from '@/lib/time';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { owned, shared } = await listDashboard(user.id);

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
    <Dashboard user={{ id: user.id, name: user.name, email: user.email }} owned={ownedD} shared={sharedD} />
  );
}
