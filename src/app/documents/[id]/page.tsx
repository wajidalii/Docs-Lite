import { notFound, redirect } from 'next/navigation';
import type { JSONContent } from '@tiptap/react';
import { getCurrentUser } from '@/lib/session';
import { findUserById } from '@/server/repositories/userRepo';
import { zUuid } from '@/lib/validation';
import { getDocumentForUser } from '@/server/services/documentService';
import { NotFoundError } from '@/server/services/access-control';
import { DocumentHeader } from '@/components/document/DocumentHeader';
import { EditorLoader as Editor } from '@/components/editor/EditorLoader';

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  if (!zUuid.safeParse(id).success) notFound();

  let data;
  try {
    data = await getDocumentForUser(id, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const canEdit = data.role === 'owner' || data.role === 'editor';
  const owner = await findUserById(data.doc.ownerId);
  const ownerFirstName = owner?.name.split(' ')[0];

  return (
    <main className="dl-doc-page">
      <DocumentHeader
        docId={id}
        initialTitle={data.doc.title}
        role={data.role}
        currentUser={{ id: user.id, name: user.name, email: user.email }}
        workspaceId={data.doc.workspaceId}
      />
      <Editor
        key={id}
        docId={id}
        initialContent={data.doc.content as JSONContent}
        editable={canEdit}
        ownerFirstName={ownerFirstName}
      />
    </main>
  );
}
