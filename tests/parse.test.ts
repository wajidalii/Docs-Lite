import { describe, it, expect } from 'vitest';
import { parseUpload } from '@/lib/upload/parse';
import { validateUpload } from '@/lib/upload/validate';

describe('validateUpload', () => {
  it('accepts .txt and .md', () => {
    expect(validateUpload({ name: 'a.txt', size: 10 })).toEqual({ ok: true, ext: 'txt' });
    expect(validateUpload({ name: 'a.md', size: 10 })).toEqual({ ok: true, ext: 'md' });
    expect(validateUpload({ name: 'A.MD', size: 10 })).toEqual({ ok: true, ext: 'md' });
  });

  it('rejects unsupported extensions', () => {
    expect(validateUpload({ name: 'a.docx', size: 10 }).ok).toBe(false);
    expect(validateUpload({ name: 'noext', size: 10 }).ok).toBe(false);
  });

  it('rejects files larger than 1MB', () => {
    expect(validateUpload({ name: 'a.md', size: 2_000_000 }).ok).toBe(false);
  });
});

describe('parseUpload — markdown', () => {
  it('parses headings, lists, and bold into Tiptap JSON', () => {
    const { content } = parseUpload('notes.md', '# Title\n\n- a\n- b\n\n1. one\n2. two\n\n**bold** text');
    const s = JSON.stringify(content);
    expect(content.type).toBe('doc');
    expect(s).toContain('"heading"');
    expect(s).toContain('"bulletList"');
    expect(s).toContain('"orderedList"');
    expect(s).toContain('"bold"');
  });

  it('derives the title from the filename (without extension)', () => {
    expect(parseUpload('My Notes.md', 'x').title).toBe('My Notes');
  });
});

describe('parseUpload — plain text', () => {
  it('keeps markdown-looking characters literal (never parsed)', () => {
    const { content } = parseUpload('plain.txt', '# not a heading\n\n- not a list');
    const s = JSON.stringify(content);
    expect(s).not.toContain('"heading"');
    expect(s).not.toContain('"bulletList"');
    expect(s).toContain('# not a heading');
  });

  it('turns an empty / whitespace-only file into a valid mountable doc', () => {
    const { content } = parseUpload('empty.txt', '   \n\n  ');
    expect(content.type).toBe('doc');
    expect(Array.isArray(content.content)).toBe(true);
    expect(content.content!.length).toBeGreaterThanOrEqual(1);
    expect(content.content![0].type).toBe('paragraph');
  });
});
