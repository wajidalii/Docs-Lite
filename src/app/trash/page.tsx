import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { listTrashForUser } from '@/server/services/documentService';
import { Trash } from '@/components/dashboard/Trash';
import { timeAgo } from '@/lib/time';

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const docs = await listTrashForUser(user.id);
  const items = docs.map((d) => ({ id: d.id, title: d.title, timeLabel: timeAgo(d.deletedAt as Date) }));

  return <Trash items={items} />;
}
