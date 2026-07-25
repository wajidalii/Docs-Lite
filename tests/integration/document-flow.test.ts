import { describe, it, expect, afterAll } from 'vitest';
import * as svc from '@/server/services/documentService';
import { NotFoundError } from '@/server/services/access-control';
import { EMPTY_DOC } from '@/lib/editor/empty';
import { closeDb } from '@/server/db/client';

// Seeded users (see src/lib/users.ts + scripts/seed.ts).
const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

let docId: string;

describe('document flow (integration — real Postgres)', () => {
  it('Alice creates a document she owns', async () => {
    docId = await svc.createDocument(ALICE);
    const { doc, role } = await svc.getDocumentForUser(docId, ALICE);
    expect(role).toBe('owner');
    expect(doc.title).toBe('Untitled');
  });

  it('saves rich content and reopens it losslessly (formatting preserved)', async () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'bold text' }],
        },
      ],
    };
    await svc.saveDocumentContent(docId, ALICE, content);

    const { doc } = await svc.getDocumentForUser(docId, ALICE);
    expect(doc.content).toEqual(content); // round-trip through jsonb, nothing dropped
  });

  it('denies Bob (not owner, not shared) with NotFound on read and write', async () => {
    await expect(svc.getDocumentForUser(docId, BOB)).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.saveDocumentContent(docId, BOB, EMPTY_DOC)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lists the document under the owner dashboard, not under a stranger', async () => {
    const alice = await svc.listDashboard(ALICE);
    expect(alice.owned.some((d) => d.id === docId)).toBe(true);

    const bob = await svc.listDashboard(BOB);
    expect(bob.owned.some((d) => d.id === docId)).toBe(false);
    expect(bob.shared.some((d) => d.id === docId)).toBe(false);
  });

  afterAll(async () => {
    if (docId) await svc.deleteDocumentForUser(docId, ALICE);
    await closeDb();
  });
});
