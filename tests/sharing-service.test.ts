import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock every repo sharingService.ts touches so this runs under plain
// `npm test` without the Dockerized Postgres the integration suite needs.
const getDocAccess = vi.fn();
const findUserById = vi.fn();
const findUserByEmail = vi.fn();
const upsertShare = vi.fn();
const removeShare = vi.fn();
const listShares = vi.fn();
const getShareRole = vi.fn();
const recordAuditEvent = vi.fn();

vi.mock('@/server/repositories/documentRepo', () => ({
  getDocAccess: (...args: unknown[]) => getDocAccess(...args),
}));
vi.mock('@/server/repositories/userRepo', () => ({
  findUserById: (...args: unknown[]) => findUserById(...args),
  findUserByEmail: (...args: unknown[]) => findUserByEmail(...args),
}));
vi.mock('@/server/repositories/shareRepo', () => ({
  upsertShare: (...args: unknown[]) => upsertShare(...args),
  removeShare: (...args: unknown[]) => removeShare(...args),
  listShares: (...args: unknown[]) => listShares(...args),
  getShareRole: (...args: unknown[]) => getShareRole(...args),
}));
vi.mock('@/server/services/auditService', () => ({
  recordAuditEvent: (...args: unknown[]) => recordAuditEvent(...args),
}));

const { shareDocument, changeRole, revokeShare } = await import('@/server/services/sharingService');

const OWNER = 'owner-id';
const TARGET = 'target-id';
const DOC = 'doc-1';

beforeEach(() => {
  getDocAccess.mockReset().mockResolvedValue({ ownerId: OWNER, deletedAt: null, shares: [] });
  findUserById.mockReset().mockResolvedValue({ id: TARGET });
  findUserByEmail.mockReset().mockResolvedValue({ id: TARGET, email: 'target@x.dev' });
  upsertShare.mockReset();
  removeShare.mockReset();
  listShares.mockReset().mockResolvedValue([]);
  getShareRole.mockReset().mockResolvedValue('viewer');
  recordAuditEvent.mockReset();
});

describe('audit trail (issue #48)', () => {
  it('shareDocument records a share.granted event', async () => {
    await shareDocument(DOC, OWNER, 'target@x.dev', 'editor');
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: OWNER, action: 'share.granted', targetType: 'document', targetId: DOC }),
    );
  });

  it('changeRole records a share.role_changed event with old and new role', async () => {
    getShareRole.mockResolvedValue('viewer');
    await changeRole(DOC, OWNER, TARGET, 'editor');
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: OWNER,
        action: 'share.role_changed',
        targetType: 'document',
        targetId: DOC,
        metadata: { targetUserId: TARGET, oldRole: 'viewer', newRole: 'editor' },
      }),
    );
  });

  it('revokeShare records a share.revoked event', async () => {
    await revokeShare(DOC, OWNER, TARGET);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: OWNER, action: 'share.revoked', targetType: 'document', targetId: DOC }),
    );
  });
});
