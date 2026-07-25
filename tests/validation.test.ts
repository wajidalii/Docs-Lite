import { describe, it, expect } from 'vitest';
import { zTitle, zEmail, zRole, zTiptapDoc, zUuid } from '@/lib/validation';

describe('validation schemas', () => {
  it('zTitle trims and requires 1..200 chars', () => {
    expect(zTitle.parse('  Hello  ')).toBe('Hello');
    expect(zTitle.safeParse('').success).toBe(false);
    expect(zTitle.safeParse('   ').success).toBe(false);
    expect(zTitle.safeParse('a'.repeat(201)).success).toBe(false);
  });

  it('zEmail accepts valid, rejects invalid', () => {
    expect(zEmail.safeParse('a@b.dev').success).toBe(true);
    expect(zEmail.safeParse('nope').success).toBe(false);
  });

  it('zRole is viewer|editor only (not owner)', () => {
    expect(zRole.safeParse('viewer').success).toBe(true);
    expect(zRole.safeParse('editor').success).toBe(true);
    expect(zRole.safeParse('owner').success).toBe(false);
  });

  it('zUuid rejects non-uuids', () => {
    expect(zUuid.safeParse('11111111-1111-4111-8111-111111111111').success).toBe(true);
    expect(zUuid.safeParse('not-a-uuid').success).toBe(false);
  });

  it('zTiptapDoc requires a doc-typed object', () => {
    expect(zTiptapDoc.safeParse({ type: 'doc', content: [] }).success).toBe(true);
    expect(zTiptapDoc.safeParse({ type: 'paragraph' }).success).toBe(false);
    expect(zTiptapDoc.safeParse('string').success).toBe(false);
  });
});
