'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, RotateCcw } from 'lucide-react';
import { restoreDoc } from '@/app/actions/documents';
import { showToast } from '@/lib/toast';
import { EmptyMotif } from '@/components/brand/EmptyMotif';

type TrashItem = { id: string; title: string; timeLabel: string };

export function Trash({ items }: { items: TrashItem[] }) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onRestore(id: string, title: string) {
    setRestoringId(id);
    startTransition(async () => {
      const res = await restoreDoc(id);
      setRestoringId(null);
      if (res.ok) {
        showToast('success', `Restored “${title}”.`);
        router.refresh();
      } else {
        showToast('error', res.error);
      }
    });
  }

  return (
    <div className="dl-app">
      <main className="dl-work">
        <div className="dl-work-head">
          <Link href="/" className="dl-icon-btn" aria-label="Back to documents">
            <ChevronLeft size={18} />
          </Link>
          <h1>Trash</h1>
          <span className="count">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="dl-empty-wrap">
            <EmptyMotif />
            <h1 className="dl-empty-h">Trash is empty</h1>
            <p className="dl-empty-p">Documents you delete show up here so you can restore them.</p>
          </div>
        ) : (
          <div className="dl-doc-card">
            {items.map((d) => (
              <div key={d.id} className="dl-doc-row">
                <span className="dl-doc-tile">
                  <FileText size={16} />
                </span>
                <span className="body">
                  <span className="title">{d.title}</span>
                  <span className="meta">Deleted {d.timeLabel}</span>
                </span>
                <button
                  type="button"
                  className="dl-btn-secondary"
                  disabled={isPending && restoringId === d.id}
                  onClick={() => onRestore(d.id, d.title)}
                >
                  {isPending && restoringId === d.id ? (
                    <span className="dl-spinner" />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
