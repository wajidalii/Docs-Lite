import type { JSONContent } from '@tiptap/react';

/** A valid, mountable empty Tiptap document (one empty paragraph). */
export const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
