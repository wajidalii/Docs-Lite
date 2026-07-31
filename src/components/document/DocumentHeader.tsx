'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { renameDoc, deleteDoc } from '@/app/actions/documents';
import { ShareDialog } from './ShareDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';
import { PresenceAvatars } from './PresenceAvatars';
import { showToast } from '@/lib/toast';
import type { EffectiveRole } from '@/lib/access';

type User = { id: string; name: string; email: string };

const roleLabel: Record<EffectiveRole, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'View only' };

export function DocumentHeader({
  docId,
  initialTitle,
  role,
  currentUser,
  workspaceId,
}: {
  docId: string;
  initialTitle: string;
  role: EffectiveRole;
  currentUser: User;
  workspaceId: string;
}) {
  const router = useRouter();
  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const [title, setTitle] = useState(initialTitle);

  async function commitRename() {
    const next = title.trim();
    if (!next || next === initialTitle) {
      setTitle(initialTitle);
      return;
    }
    const res = await renameDoc(docId, next);
    if (!res.ok) setTitle(initialTitle);
    else router.refresh();
  }

  async function onDelete() {
    if (!confirm('Move this document to trash? You can restore it later.')) return;
    const res = await deleteDoc(docId);
    if (!res.ok) {
      showToast('error', res.error);
      router.refresh();
    }
  }

  return (
    <header className="dl-edhead">
      <Link href="/" className="dl-icon-btn" aria-label="Back to documents">
        <ChevronLeft size={18} />
      </Link>

      {isOwner ? (
        <input
          className="dl-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label="Document title"
        />
      ) : (
        <span className="dl-title-static">{initialTitle}</span>
      )}

      <PresenceAvatars docId={docId} />

      <span className="dl-pill" data-role={role}>
        {roleLabel[role]}
      </span>

      {canEdit && <VersionHistoryDialog docId={docId} docTitle={title} />}

      {isOwner && <ShareDialog docId={docId} docTitle={title} owner={currentUser} workspaceId={workspaceId} />}

      {isOwner && (
        <button type="button" className="dl-icon-btn is-danger" onClick={onDelete} aria-label="Delete document">
          <Trash2 size={17} />
        </button>
      )}
    </header>
  );
}
