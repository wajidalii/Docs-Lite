'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Monitor, LogOut } from 'lucide-react';
import { revokeSession, signOutAllDevices } from '@/app/actions/sessions';
import { showToast } from '@/lib/toast';
import { timeAgo } from '@/lib/time';
import { summarizeUserAgent } from '@/lib/userAgent';
import { Button } from '@/components/ui/button';

type Session = { id: string; createdAt: Date; lastSeenAt: Date; userAgent: string | null };

export function SessionsList({
  sessions: initialSessions,
  currentSessionId,
}: {
  sessions: Session[];
  currentSessionId: string | null;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function onRevoke(id: string) {
    setRevokingId(id);
    const res = await revokeSession(id);
    setRevokingId(null);
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('success', 'Session revoked.');
      router.refresh();
    } else {
      showToast('error', res.error);
    }
  }

  async function onSignOutAll() {
    if (!confirm('Sign out of all devices? Everyone (including this device) will need to sign in again.')) return;
    setSigningOutAll(true);
    await signOutAllDevices();
    // signOutAllDevices redirects on success; this only runs if something
    // upstream throws before the redirect fires.
    setSigningOutAll(false);
  }

  return (
    <div className="dl-app">
      <main className="dl-work">
        <div className="dl-work-head">
          <Link href="/" className="dl-icon-btn" aria-label="Back to documents">
            <ChevronLeft size={18} />
          </Link>
          <h1>Active sessions</h1>
          <span className="count">{sessions.length}</span>
        </div>

        <div className="dl-ws-body">
          <ul className="dl-access-list">
            {sessions.map((s) => (
              <li key={s.id} className="dl-access-row">
                <Monitor size={18} />
                <span className="txt">
                  <span className="name">
                    {summarizeUserAgent(s.userAgent)}
                    {s.id === currentSessionId ? ' (this device)' : ''}
                  </span>
                  <span className="email">Last active {timeAgo(s.lastSeenAt)}</span>
                </span>
                {s.id !== currentSessionId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="is-danger"
                    disabled={revokingId === s.id}
                    onClick={() => onRevoke(s.id)}
                  >
                    {revokingId === s.id ? <span className="dl-spinner" /> : 'Revoke'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {sessions.length === 0 && <p className="dl-access-empty">No active sessions.</p>}

          <section className="dl-ws-section">
            <span className="dl-eyebrow">Danger zone</span>
            <Button type="button" variant="destructive" disabled={signingOutAll} onClick={onSignOutAll}>
              {signingOutAll ? <span className="dl-spinner" /> : (
                <>
                  <LogOut size={15} /> Sign out all devices
                </>
              )}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
