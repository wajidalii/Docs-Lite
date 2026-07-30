'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { renameWorkspace, removeMember, changeMemberRole, leaveWorkspace } from '@/app/actions/workspaces';
import { showToast } from '@/lib/toast';
import { Avatar } from '@/components/brand/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Member = { userId: string; name: string; email: string; role: 'member' | 'admin' };
type Owner = { id: string; name: string; email: string };
type Role = 'owner' | 'admin' | 'member';

const roleLabel: Record<Member['role'], string> = { admin: 'Admin', member: 'Member' };

export function WorkspaceSettings({
  workspaceId,
  name: initialName,
  role,
  currentUserId,
  owner,
  members: initialMembers,
}: {
  workspaceId: string;
  name: string;
  role: Role;
  currentUserId: string;
  owner: Owner | null;
  members: Member[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [members, setMembers] = useState(initialMembers);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isAdmin = role === 'owner' || role === 'admin';
  const canLeave = role !== 'owner';

  async function commitRename() {
    const next = name.trim();
    if (!next || next === initialName) {
      setName(initialName);
      return;
    }
    setSaving(true);
    const res = await renameWorkspace(workspaceId, next);
    setSaving(false);
    if (res.ok) {
      showToast('success', 'Workspace renamed.');
      router.refresh();
    } else {
      setName(initialName);
      showToast('error', res.error);
    }
  }

  async function onRoleChange(m: Member, newRole: string) {
    const res = await changeMemberRole(workspaceId, m.userId, newRole);
    if (res.ok) {
      setMembers(res.members);
      showToast('success', `${m.name.split(' ')[0]} is now ${newRole === 'admin' ? 'an admin' : 'a member'}.`);
    } else showToast('error', res.error);
  }

  async function onRemove(m: Member) {
    if (!confirm(`Remove ${m.name} from this workspace?`)) return;
    const res = await removeMember(workspaceId, m.userId);
    if (res.ok) {
      setMembers(res.members);
      showToast('success', `Removed ${m.name.split(' ')[0]}.`);
    } else showToast('error', res.error);
  }

  async function onLeave() {
    if (!confirm('Leave this workspace? You will lose access to its documents.')) return;
    setLeaving(true);
    const res = await leaveWorkspace(workspaceId);
    // On success leaveWorkspace redirects — this line only runs on the error path.
    if (!res.ok) {
      setLeaving(false);
      showToast('error', res.error);
    }
  }

  return (
    <main className="dl-doc-page">
      <header className="dl-edhead">
        <Link href="/" className="dl-icon-btn" aria-label="Back to documents">
          <ChevronLeft size={18} />
        </Link>
        <span className="dl-title-static">Workspace settings</span>
      </header>

      <div className="dl-work">
        <div className="dl-ws-body">
          <section className="dl-ws-section">
            <span className="dl-eyebrow">Name</span>
            {isAdmin ? (
              <Input
                className="dl-ws-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                aria-label="Workspace name"
                disabled={saving}
              />
            ) : (
              <p className="dl-ws-name-static">{name}</p>
            )}
          </section>

          <section className="dl-ws-section">
            <div className="dl-access-head">
              <span className="dl-eyebrow">Members</span>
            </div>
            <ul className="dl-access-list">
              {owner && (
                <li className="dl-access-row">
                  <Avatar id={owner.id} name={owner.name} size={32} />
                  <span className="txt">
                    <span className="name">
                      {owner.name}
                      {owner.id === currentUserId ? ' (you)' : ''}
                    </span>
                    <span className="email">{owner.email}</span>
                  </span>
                  <span className="owner-tag">Owner</span>
                </li>
              )}
              {members.map((m) => (
                <li key={m.userId} className="dl-access-row">
                  <Avatar id={m.userId} name={m.name} size={32} />
                  <span className="txt">
                    <span className="name">
                      {m.name}
                      {m.userId === currentUserId ? ' (you)' : ''}
                    </span>
                    <span className="email">{m.email}</span>
                  </span>
                  {isAdmin ? (
                    <>
                      <select
                        className="dl-field"
                        value={m.role}
                        onChange={(e) => onRoleChange(m, e.target.value)}
                        aria-label={`Role for ${m.name}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="is-danger"
                        aria-label={`Remove ${m.name}`}
                        onClick={() => onRemove(m)}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <span className="dl-pill" data-role={m.role}>
                      {roleLabel[m.role]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {members.length === 0 && <p className="dl-access-empty">Just you (and the owner) for now.</p>}
          </section>

          {canLeave && (
            <section className="dl-ws-section">
              <span className="dl-eyebrow">Danger zone</span>
              <Button type="button" variant="destructive" disabled={leaving} onClick={onLeave}>
                {leaving ? <span className="dl-spinner" /> : 'Leave workspace'}
              </Button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
