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

type Node = { type?: string; attrs?: Record<string, unknown>; marks?: { type: string }[]; text?: string; content?: Node[] };

function findAll(node: Node, type: string): Node[] {
  const out: Node[] = [];
  if (node.type === type) out.push(node);
  for (const child of node.content ?? []) out.push(...findAll(child, type));
  return out;
}

function findText(node: Node, text: string): Node | undefined {
  if (node.type === 'text' && node.text === text) return node;
  for (const child of node.content ?? []) {
    const found = findText(child, text);
    if (found) return found;
  }
  return undefined;
}

describe('parseUpload — markdown', () => {
  it('parses headings, lists, and bold into structurally correct Tiptap JSON (not just present-somewhere substrings)', () => {
    const { content } = parseUpload('notes.md', '# Title\n\n- a\n- b\n\n1. one\n2. two\n\n**bold** text');
    expect(content.type).toBe('doc');

    const headings = findAll(content as Node, 'heading');
    expect(headings).toHaveLength(1);
    expect(headings[0].attrs?.level).toBe(1);
    expect(findText(headings[0], 'Title')).toBeTruthy();

    const bulletLists = findAll(content as Node, 'bulletList');
    expect(bulletLists).toHaveLength(1);
    expect(findAll(bulletLists[0], 'listItem')).toHaveLength(2);
    expect(findText(bulletLists[0], 'a')).toBeTruthy();
    expect(findText(bulletLists[0], 'b')).toBeTruthy();

    const orderedLists = findAll(content as Node, 'orderedList');
    expect(orderedLists).toHaveLength(1);
    expect(findAll(orderedLists[0], 'listItem')).toHaveLength(2);

    const boldText = findText(content as Node, 'bold');
    expect(boldText?.marks?.some((m) => m.type === 'bold')).toBe(true);
  });

  it('derives the title from the filename (without extension)', () => {
    expect(parseUpload('My Notes.md', 'x').title).toBe('My Notes');
  });

  it('turns an empty / whitespace-only markdown file into a valid mountable doc', () => {
    const { content } = parseUpload('empty.md', '   \n\n  ');
    expect(content.type).toBe('doc');
    expect(Array.isArray(content.content)).toBe(true);
    expect(content.content!.length).toBeGreaterThanOrEqual(1);
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
