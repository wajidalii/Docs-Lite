import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertAuditEvent = vi.fn();
const listAuditEventsForTarget = vi.fn();

vi.mock('@/server/repositories/auditRepo', () => ({
  insertAuditEvent: (...args: unknown[]) => insertAuditEvent(...args),
  listAuditEventsForTarget: (...args: unknown[]) => listAuditEventsForTarget(...args),
}));

const { recordAuditEvent, listAuditEventsForTarget: listSvc } = await import('@/server/services/auditService');

beforeEach(() => {
  insertAuditEvent.mockReset();
  listAuditEventsForTarget.mockReset();
});

describe('recordAuditEvent', () => {
  it('writes the event with the given fields', async () => {
    insertAuditEvent.mockResolvedValue(undefined);
    const event = {
      actorId: 'user-1',
      action: 'share.granted',
      targetType: 'document',
      targetId: 'doc-1',
      metadata: { targetUserId: 'user-2', role: 'viewer' },
    };
    await recordAuditEvent(event);
    expect(insertAuditEvent).toHaveBeenCalledWith(event);
  });

  it('never throws even if the underlying write fails (audit logging must not break the primary action)', async () => {
    insertAuditEvent.mockRejectedValue(new Error('db unavailable'));
    await expect(
      recordAuditEvent({ actorId: 'user-1', action: 'share.granted', targetType: 'document', targetId: 'doc-1' }),
    ).resolves.toBeUndefined();
  });
});

describe('listAuditEventsForTarget', () => {
  it('passes through to the repo', async () => {
    listAuditEventsForTarget.mockResolvedValue([{ id: 'e1' }]);
    await expect(listSvc('document', 'doc-1')).resolves.toEqual([{ id: 'e1' }]);
    expect(listAuditEventsForTarget).toHaveBeenCalledWith('document', 'doc-1');
  });
});
