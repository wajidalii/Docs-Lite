'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function UploadButton({ className = 'dl-btn-secondary' }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!(lower.endsWith('.txt') || lower.endsWith('.md'))) {
      showToast('error', 'Only .txt and .md files can be uploaded.');
      return;
    }
    if (file.size > 1_000_000) {
      showToast('error', 'That file is over 1 MB — try a smaller one.');
      return;
    }

    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        showToast('success', `Imported “${file.name.replace(/\.[^.]+$/, '')}”.`);
        router.push(`/documents/${data.id}`);
        return;
      }
      showToast('error', data.error ?? 'Upload failed. Try that file again.');
    } catch {
      showToast('error', 'Upload failed. Try that file again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <span className="dl-spinner" /> : <Upload size={16} />}
        {busy ? 'Uploading…' : 'Upload .txt / .md'}
      </button>
      <input ref={inputRef} type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={onChange} />
    </>
  );
}
