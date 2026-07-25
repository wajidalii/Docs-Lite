import type { JSONContent } from '@tiptap/react';
import { MarkdownManager } from '@tiptap/markdown';
import { extensions } from '@/lib/editor/extensions';
import { EMPTY_DOC } from '@/lib/editor/empty';
import { extname } from './validate';

export type ParsedUpload = { title: string; content: JSONContent };

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, '').trim();
  return base || 'Untitled';
}

/** Ensure a doc has at least one block node, so it always mounts in the editor. */
function ensureMountable(doc: JSONContent): JSONContent {
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content) || doc.content.length === 0) {
    return structuredClone(EMPTY_DOC);
  }
  return doc;
}

/** Plain text → paragraphs split on blank lines. Never interpreted as markdown. */
function textToDoc(text: string): JSONContent {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return structuredClone(EMPTY_DOC);

  return {
    type: 'doc',
    content: blocks.map((block) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: block }],
    })),
  };
}

export function parseUpload(filename: string, text: string): ParsedUpload {
  const title = titleFromFilename(filename);
  const ext = extname(filename);

  if (ext === 'md') {
    const manager = new MarkdownManager({ extensions });
    return { title, content: ensureMountable(manager.parse(text)) };
  }

  // .txt (and any non-md path) — literal paragraphs.
  return { title, content: ensureMountable(textToDoc(text)) };
}
