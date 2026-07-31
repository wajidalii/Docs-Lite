import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repo so these tests run under plain `npm test` without the
// Dockerized Postgres the integration suite needs.
const listSessionsForUser = vi.fn();
const deleteSessionForUser = vi.fn();
const deleteAllSessionsForUser = vi.fn();

vi.mock('@/server/repositories/sessionRepo', () => ({
  listSessionsForUser: (...args: unknown[]) => listSessionsForUser(...args),
  deleteSessionForUser: (...args: unknown[]) => deleteSessionForUser(...args),
  deleteAllSessionsForUser: (...args: unknown[]) => deleteAllSessionsForUser(...args),
}));

const { revokeSession, signOutAllDevices, listSessionsForUser: listSessionsSvc } = await import(
  '@/server/services/sessionService'
);

const OWNER = 'owner-id';

beforeEach(() => {
  listSessionsForUser.mockReset();
  deleteSessionForUser.mockReset();
  deleteAllSessionsForUser.mockReset();
});

describe('revokeSession', () => {
  it('scopes the delete to the acting user — cannot be used to revoke another user\'s session', async () => {
    await revokeSession('session-1', OWNER);
    // deleteSessionForUser's own WHERE clause (id AND userId) is the real
    // enforcement (tests/integration exercises that against a real DB);
    // this confirms the service passes the caller's userId through
    // unmodified rather than, say, trusting a client-supplied owner id.
    expect(deleteSessionForUser).toHaveBeenCalledWith('session-1', OWNER);
  });
});

describe('signOutAllDevices', () => {
  it('revokes every session for the acting user only', async () => {
    await signOutAllDevices(OWNER);
    expect(deleteAllSessionsForUser).toHaveBeenCalledWith(OWNER);
  });
});

describe('listSessionsForUser', () => {
  it('lists only the acting user\'s sessions', async () => {
    listSessionsForUser.mockResolvedValue([{ id: 's1', userId: OWNER }]);
    await expect(listSessionsSvc(OWNER)).resolves.toEqual([{ id: 's1', userId: OWNER }]);
    expect(listSessionsForUser).toHaveBeenCalledWith(OWNER);
  });
});
