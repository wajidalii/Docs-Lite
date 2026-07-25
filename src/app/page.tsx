import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { listDashboard } from '@/server/services/documentService';
import { Dashboard } from '@/components/dashboard/Dashboard';

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

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
