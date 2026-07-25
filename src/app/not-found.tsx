import Link from 'next/link';
import { FileX2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)' }}>
      <div className="dl-empty-wrap" style={{ margin: 0 }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line)',
            boxShadow: 'var(--shadow-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-muted)',
            margin: '0 auto',
          }}
        >
          <FileX2 size={22} />
        </span>
        <h1 className="dl-empty-h">This document isn&apos;t available</h1>
        <p className="dl-empty-p">
          It may have been deleted, or you may not have access yet. Ask the owner to share it with you.
        </p>
        <div className="dl-empty-actions">
          <Link href="/" className="dl-btn-primary">
            Back to documents
          </Link>
        </div>
      </div>
    </div>
  );
}
