'use client';

import { useState, type FormEvent } from 'react';
import { Share2, X, AlertCircle } from 'lucide-react';
import {
  shareDoc,
  changeRole,
  revokeShare,
  listCollaborators,
  type ShareResult,
} from '@/app/actions/sharing';
import { listMembers, type WorkspaceMembersResult } from '@/app/actions/workspaces';
import { Avatar } from '@/components/brand/Avatar';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Collaborator = Extract<ShareResult, { ok: true }>['collaborators'][number];
type WorkspaceMember = Extract<WorkspaceMembersResult, { ok: true }>['members'][number];
type User = { id: string; name: string; email: string };

const first = (n: string) => n.split(' ')[0];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verb = (r: string) => (r === 'editor' ? 'edit' : 'view');

export function ShareDialog({
  docId,
  docTitle,
  owner,
  workspaceId,
}: {
  docId: string;
  docTitle: string;
  owner: User;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [wsMembers, setWsMembers] = useState<WorkspaceMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setEmail('');
      return;
    }
    setError(null);
    const [r, m] = await Promise.all([listCollaborators(docId), listMembers(workspaceId)]);
    if (r.ok) setCollabs(r.collaborators);
    if (m.ok) setWsMembers(m.members);
  }

  const pickableMembers = wsMembers.filter(
    (m) => m.userId !== owner.id && !collabs.some((c) => c.userId === m.userId),
  );

  async function onShare(e: FormEvent) {
    e.preventDefault();
    const val = email.trim();
    if (!val) return setError('Enter an email address.');
    if (!EMAIL_RE.test(val)) return setError("That doesn't look like an email address.");
    if (val.toLowerCase() === owner.email.toLowerCase())
      return setError(`${first(owner.name)} already owns this document.`);
    const existing = collabs.find((c) => c.email.toLowerCase() === val.toLowerCase());
    if (existing) return setError(`${first(existing.name)} already has access.`);

    setBusy(true);
    setError(null);
    const res = await shareDoc(docId, val, role);
    setBusy(false);
    if (!res.ok) {
      return setError(res.error === 'No user with that email' ? 'No DocsLite account uses that email.' : res.error);
    }
    setCollabs(res.collaborators);
    const added = res.collaborators.find((c) => c.email.toLowerCase() === val.toLowerCase());
    if (added) showToast('success', `${added.name} can now ${verb(added.role)} this document.`);
    setEmail('');
  }

  async function onRoleChange(c: Collaborator, newRole: string) {
    const res = await changeRole(docId, c.userId, newRole);
    if (res.ok) {
      setCollabs(res.collaborators);
      showToast('success', `${first(c.name)} can now ${verb(newRole)}.`);
    } else showToast('error', res.error);
  }

  async function onRevoke(c: Collaborator) {
    const res = await revokeShare(docId, c.userId);
    if (res.ok) {
      setCollabs(res.collaborators);
      showToast('success', `Removed ${first(c.name)}'s access.`);
    } else showToast('error', res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="dl-share-btn">
          <Share2 size={15} /> Share
        </Button>
      </DialogTrigger>

      <DialogContent className="dl-share-dialog" aria-label="Share document">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>{docTitle}</DialogDescription>
        </DialogHeader>

        <div>
          <form className="dl-share-form" onSubmit={onShare}>
            <Input
              aria-invalid={!!error}
              type="email"
              placeholder="teammate@docslite.dev"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              aria-label="Collaborator email"
            />
            <select
              className="dl-field"
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
              aria-label="Role"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <Button type="submit" disabled={busy}>
              {busy ? <span className="dl-spinner" /> : 'Share'}
            </Button>
          </form>
          {error ? (
            <p className="dl-share-msg is-error" role="alert">
              <AlertCircle size={14} /> {error}
            </p>
          ) : (
            <p className="dl-share-msg">Demo teammates: bob@, carol@, dave@ (docslite.dev)</p>
          )}

          {pickableMembers.length > 0 && (
            <div className="dl-member-picker">
              <span className="dl-eyebrow">From your workspace</span>
              <div className="dl-member-chips">
                {pickableMembers.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    className="dl-member-chip"
                    onClick={() => {
                      setEmail(m.email);
                      setError(null);
                    }}
                  >
                    <Avatar id={m.userId} name={m.name} size={18} />
                    {first(m.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="dl-access-head">
            <span className="dl-eyebrow">People with access</span>
          </div>
          <ul className="dl-access-list">
            <li className="dl-access-row">
              <Avatar id={owner.id} name={owner.name} size={32} />
              <span className="txt">
                <span className="name">{owner.name} (you)</span>
                <span className="email">{owner.email}</span>
              </span>
              <span className="owner-tag">Owner</span>
            </li>
            {collabs.map((c) => (
              <li key={c.userId} className="dl-access-row">
                <Avatar id={c.userId} name={c.name} size={32} />
                <span className="txt">
                  <span className="name">{c.name}</span>
                  <span className="email">{c.email}</span>
                </span>
                <select
                  className="dl-field"
                  value={c.role}
                  onChange={(e) => onRoleChange(c, e.target.value)}
                  aria-label={`Role for ${c.name}`}
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="is-danger"
                  aria-label={`Remove ${c.name}`}
                  onClick={() => onRevoke(c)}
                >
                  <X size={16} />
                </Button>
              </li>
            ))}
          </ul>
          {collabs.length === 0 && (
            <p className="dl-access-empty">Only you have access. Add a teammate above to start collaborating.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
