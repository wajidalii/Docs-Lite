import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { listMySessions } from '@/app/actions/sessions';
import { SessionsList } from '@/components/settings/SessionsList';

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const res = await listMySessions();
  const sessions = res.ok ? res.sessions : [];
  const currentSessionId = res.ok ? res.currentSessionId : null;

  return (
    <SessionsList
      sessions={sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        userAgent: s.userAgent,
      }))}
      currentSessionId={currentSessionId}
    />
  );
}
