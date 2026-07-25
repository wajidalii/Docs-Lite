import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as docs from '@/server/services/documentService';
import * as sharing from '@/server/services/sharingService';
import { ShareError } from '@/server/services/sharingService';
import { NotFoundError } from '@/server/services/access-control';
import { EMPTY_DOC } from '@/lib/editor/empty';
import { closeDb } from '@/server/db/client';

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const ALICE_EMAIL = 'alice@docslite.dev';
const BOB_EMAIL = 'bob@docslite.dev';

let docId: string;

describe('sharing flow (integration — real Postgres)', () => {
  beforeAll(async () => {
    docId = await docs.createDocument(ALICE);
  });

  it('sharing with Bob as viewer lets him read but not edit', async () => {
    const collabs = await sharing.shareDocument(docId, ALICE, BOB_EMAIL, 'viewer');
    expect(collabs).toHaveLength(1);
    expect(collabs[0]).toMatchObject({ userId: BOB, role: 'viewer' });

    const bobDash = await docs.listDashboard(BOB);
    expect(bobDash.shared.some((d) => d.id === docId && d.role === 'viewer')).toBe(true);

    const opened = await docs.getDocumentForUser(docId, BOB);
    expect(opened.role).toBe('viewer');

    await expect(docs.saveDocumentContent(docId, BOB, EMPTY_DOC)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('promoting Bob to editor lets him save', async () => {
    await sharing.changeRole(docId, ALICE, BOB, 'editor');
    await expect(docs.saveDocumentContent(docId, BOB, EMPTY_DOC)).resolves.toBeUndefined();
    const opened = await docs.getDocumentForUser(docId, BOB);
    expect(opened.role).toBe('editor');
  });

  it('re-sharing changes the role instead of duplicating (upsert)', async () => {
    const collabs = await sharing.shareDocument(docId, ALICE, BOB_EMAIL, 'viewer');
    expect(collabs).toHaveLength(1);
    expect(collabs[0].role).toBe('viewer');
  });

  it('revoking removes access', async () => {
    const collabs = await sharing.revokeShare(docId, ALICE, BOB);
    expect(collabs).toHaveLength(0);
    await expect(docs.getDocumentForUser(docId, BOB)).rejects.toBeInstanceOf(NotFoundError);
    const bobDash = await docs.listDashboard(BOB);
    expect(bobDash.shared.some((d) => d.id === docId)).toBe(false);
  });

  it('rejects sharing with an unknown email', async () => {
    await expect(sharing.shareDocument(docId, ALICE, 'nobody@nowhere.dev', 'viewer')).rejects.toBeInstanceOf(ShareError);
  });

  it('rejects sharing with yourself (the owner)', async () => {
    await expect(sharing.shareDocument(docId, ALICE, ALICE_EMAIL, 'viewer')).rejects.toBeInstanceOf(ShareError);
  });

  it('a non-owner cannot share (owner-only)', async () => {
    await expect(sharing.shareDocument(docId, BOB, BOB_EMAIL, 'editor')).rejects.toBeInstanceOf(NotFoundError);
  });

  afterAll(async () => {
    if (docId) await docs.deleteDocumentForUser(docId, ALICE);
    await closeDb();
  });
});
