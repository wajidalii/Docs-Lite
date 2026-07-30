'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, LogOut, Menu, X, ChevronRight, Trash2 } from 'lucide-react';
import { createDoc } from '@/app/actions/documents';
import { setActiveWorkspace } from '@/app/actions/workspaces';
import { signOut } from '@/app/actions/auth';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/brand/Avatar';
import { EmptyMotif } from '@/components/brand/EmptyMotif';
import { showToast } from '@/lib/toast';
import { UploadButton } from './UploadButton';

type Role = 'owner' | 'editor' | 'viewer';
type Doc = { id: string; title: string; timeLabel: string; role: Role };
type User = { id: string; name: string; email: string };
type Workspace = { id: string; name: string; role: 'owner' | 'admin' | 'member' };

const roleLabel: Record<Role, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'View only' };

export function Dashboard({
  user,
  owned,
  shared,
  workspaces,
  activeWorkspaceId,
}: {
  user: User;
  owned: Doc[];
  shared: Doc[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const all = [...owned, ...shared];

  async function onSwitchWorkspace(id: string) {
    if (id === activeWorkspaceId) return;
    setSwitching(true);
    const res = await setActiveWorkspace(id);
    setSwitching(false);
    if (res.ok) router.refresh();
    else showToast('error', res.error);
  }

  return (
    <div className="dl-app" data-drawer={drawerOpen ? 'open' : 'closed'}>
      {/* mobile top app bar */}
      <div className="dl-topbar">
        <button className="dl-hamburger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          <Menu size={20} />
        </button>
        <span className="word">DocsLite</span>
        <span className="grow" />
        <form action={createDoc}>
          <button type="submit" className="dl-btn-primary" style={{ minHeight: 36, padding: '0 12px' }}>
            <Plus size={16} /> New
          </button>
        </form>
      </div>

      <div className="dl-scrim" onClick={() => setDrawerOpen(false)} />

      {/* sidebar */}
      <aside className="dl-sidebar">
        <div className="dl-side-brand">
          <Logo size={24} />
          <span className="word">DocsLite</span>
          <button className="dl-icon-btn dl-side-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {workspaces.length > 1 && (
          <div className="dl-side-ws-switcher">
            <select
              className="dl-field"
              value={activeWorkspaceId}
              disabled={switching}
              onChange={(e) => onSwitchWorkspace(e.target.value)}
              aria-label="Switch workspace"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="dl-side-actions">
          <form action={createDoc}>
            <button type="submit" className="dl-btn-primary">
              <Plus size={16} /> New document
            </button>
          </form>
          <UploadButton />
        </div>

        <nav className="dl-side-nav">
          <section className="dl-side-sec">
            <div className="dl-side-sec-head">
              <span className="dl-eyebrow">My documents</span>
              <span className="count">{owned.length}</span>
            </div>
            {owned.length === 0 ? (
              <p className="dl-side-empty">No documents yet.</p>
            ) : (
              <ul className="dl-side-list">
                {owned.map((d) => (
                  <li key={d.id}>
                    <Link href={`/documents/${d.id}`} className="dl-side-row">
                      <FileText size={15} className="fico" />
                      <span className="txt">
                        <span className="title">{d.title}</span>
                        <span className="meta">{d.timeLabel}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dl-side-sec">
            <div className="dl-side-sec-head">
              <span className="dl-eyebrow">Shared with me</span>
              <span className="count">{shared.length}</span>
            </div>
            {shared.length === 0 ? (
              <p className="dl-side-empty">Nothing shared with you.</p>
            ) : (
              <ul className="dl-side-list">
                {shared.map((d) => (
                  <li key={d.id}>
                    <Link href={`/documents/${d.id}`} className="dl-side-row">
                      <FileText size={15} className="fico" />
                      <span className="txt">
                        <span className="title">{d.title}</span>
                        <span className="meta">
                          {roleLabel[d.role]} · {d.timeLabel}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </nav>

        <Link href="/trash" className="dl-side-row dl-side-trash">
          <Trash2 size={15} className="fico" />
          <span className="txt">
            <span className="title">Trash</span>
          </span>
        </Link>

        <div className="dl-side-user">
          <Avatar id={user.id} name={user.name} size={30} />
          <span className="txt">
            <span className="name">{user.name}</span>
            <span className="email">{user.email}</span>
          </span>
          <form action={signOut}>
            <button type="submit" className="dl-icon-btn" title="Sign out" aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </aside>

      {/* workspace */}
      <main className="dl-work">
        {all.length === 0 ? (
          <div className="dl-empty-wrap">
            <EmptyMotif />
            <h1 className="dl-empty-h">Nothing here yet</h1>
            <p className="dl-empty-p">
              Create a document, or upload a .txt or .md file and we&apos;ll turn it into one you can edit.
            </p>
            <div className="dl-empty-actions">
              <form action={createDoc}>
                <button type="submit" className="dl-btn-primary">
                  <Plus size={16} /> New document
                </button>
              </form>
              <UploadButton />
            </div>
          </div>
        ) : (
          <>
            <div className="dl-work-head">
              <h1>Documents</h1>
              <span className="count">{all.length}</span>
            </div>
            <div className="dl-doc-card">
              {all.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} className="dl-doc-row">
                  <span className="dl-doc-tile">
                    <FileText size={16} />
                  </span>
                  <span className="body">
                    <span className="title">{d.title}</span>
                    <span className="meta">
                      {roleLabel[d.role]} · {d.timeLabel}
                    </span>
                  </span>
                  <span className="dl-pill role-pill" data-role={d.role}>
                    {roleLabel[d.role]}
                  </span>
                  <ChevronRight size={16} className="chev" />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
