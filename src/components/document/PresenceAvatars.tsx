'use client';

import { useEffect, useState } from 'react';
import { heartbeatPresence, listPresence, type ListPresenceResult } from '@/app/actions/presence';
import { Avatar } from '@/components/brand/Avatar';

type Viewer = Extract<ListPresenceResult, { ok: true }>['viewers'][number];

// Matches presenceService.ACTIVE_WINDOW_MS's slack (a couple of missed
// heartbeats' worth) so a normal polling gap doesn't flicker someone out.
const POLL_MS = 6_000;

export function PresenceAvatars({ docId }: { docId: string }) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      await heartbeatPresence(docId);
      const res = await listPresence(docId);
      if (!cancelled && res.ok) setViewers(res.viewers);
    }

    void tick();
    const interval = setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [docId]);

  if (viewers.length === 0) return null;

  return (
    <div className="dl-presence" title={`${viewers.map((v) => v.name).join(', ')} also viewing`}>
      {viewers.slice(0, 4).map((v) => (
        <Avatar key={v.userId} id={v.userId} name={v.name} size={26} />
      ))}
      {viewers.length > 4 && <span className="dl-presence-more">+{viewers.length - 4}</span>}
    </div>
  );
}
