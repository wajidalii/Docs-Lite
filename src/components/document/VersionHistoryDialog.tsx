'use client';

import { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { listVersions, restoreVersion, type ListVersionsResult } from '@/app/actions/versions';
import { showToast } from '@/lib/toast';
import { timeAgo } from '@/lib/time';

type Version = Extract<ListVersionsResult, { ok: true }>['versions'][number];

export function VersionHistoryDialog({ docId, docTitle }: { docId: string; docTitle: string }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function openDialog() {
    setOpen(true);
    setLoading(true);
    const res = await listVersions(docId);
    setLoading(false);
    if (res.ok) setVersions(res.versions);
    else showToast('error', res.error);
  }

  async function onRestore(v: Version) {
    if (!confirm(`Restore the version from ${timeAgo(v.createdAt)}? Your current content will be saved as a version first.`))
      return;
    setRestoringId(v.id);
    const res = await restoreVersion(docId, v.id);
    setRestoringId(null);
    if (res.ok) {
      showToast('success', 'Version restored.');
      window.location.reload();
    } else {
      showToast('error', res.error);
    }
  }

  return (
    <>
      <button type="button" className="dl-icon-btn" onClick={openDialog} aria-label="Version history" title="Version history">
        <History size={17} />
      </button>

      {open && (
        <div className="dl-modal-scrim" onClick={() => setOpen(false)}>
          <div
            className="dl-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Version history"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dl-modal-head">
              <span className="txt">
                <h2>Version history</h2>
                <span className="subt">{docTitle}</span>
              </span>
              <button type="button" className="dl-icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="dl-access-head">
                <span className="dl-eyebrow">Snapshots</span>
              </div>
              {loading ? (
                <p className="dl-access-empty">Loading…</p>
              ) : versions.length === 0 ? (
                <p className="dl-access-empty">
                  No versions yet. A snapshot is saved every few minutes while you edit.
                </p>
              ) : (
                <ul className="dl-access-list">
                  {versions.map((v) => (
                    <li key={v.id} className="dl-access-row">
                      <span className="txt">
                        <span className="name">{timeAgo(v.createdAt)}</span>
                        <span className="email">by {v.authorName}</span>
                      </span>
                      <button
                        type="button"
                        className="dl-btn-secondary"
                        disabled={restoringId === v.id}
                        onClick={() => onRestore(v)}
                      >
                        {restoringId === v.id ? <span className="dl-spinner" /> : 'Restore'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
