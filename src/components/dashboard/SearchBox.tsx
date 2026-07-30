'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, FileText } from 'lucide-react';
import { searchDocs, type SearchDocsResult } from '@/app/actions/documents';
import { timeAgo } from '@/lib/time';

type Result = Extract<SearchDocsResult, { ok: true }>['results'][number];

const roleLabel: Record<string, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'View only' };

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function onChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchDocs(trimmed);
      setLoading(false);
      if (res.ok) {
        setResults(res.results);
        setOpen(true);
      }
    }, 300);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="dl-search" ref={boxRef}>
      <Search size={15} className="dl-search-ico" />
      <input
        className="dl-search-input"
        type="search"
        placeholder="Search documents…"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clear();
        }}
        aria-label="Search documents"
      />
      {query && (
        <button type="button" className="dl-search-clear" aria-label="Clear search" onClick={clear}>
          <X size={14} />
        </button>
      )}

      {open && (
        <div className="dl-search-results">
          {loading ? (
            <p className="dl-search-empty">Searching…</p>
          ) : results.length === 0 ? (
            <p className="dl-search-empty">No documents match &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            results.map((r) => (
              <Link key={r.id} href={`/documents/${r.id}`} className="dl-search-row" onClick={() => setOpen(false)}>
                <FileText size={15} className="fico" />
                <span className="txt">
                  <span className="title">{r.title}</span>
                  <span className="meta">
                    {roleLabel[r.role] ?? r.role} · {timeAgo(r.updatedAt)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
