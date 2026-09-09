'use client';

import { useRef, useState } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import { Eye } from 'lucide-react';
import { editorExtensions } from '@/lib/editor/extensions';
import { saveDoc } from '@/app/actions/documents';
import { Toolbar, type SaveStatus } from './Toolbar';

export function Editor({
  docId,
  initialContent,
  editable,
  ownerFirstName,
}: {
  docId: string;
  initialContent: JSONContent;
  editable: boolean;
  ownerFirstName?: string;
}) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const inFlight = useRef(false);
  const pending = useRef<JSONContent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = async () => {
    if (inFlight.current || pending.current == null) return;
    const content = pending.current;
    pending.current = null;
    inFlight.current = true;
    setStatus('saving');
    try {
      const res = await saveDoc(docId, content);
      setStatus(res?.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
      if (pending.current != null) void flush();
    }
  };

  const schedule = (content: JSONContent) => {
    pending.current = content;
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 750);
  };

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editable,
    immediatelyRender: false,
    // The plain JSON round-trip is deliberate, not a no-op: passing
    // editor.getJSON()'s result straight into the Server Action call lets
    // Next.js's Flight client treat some node's `attrs` (e.g. a heading's
    // `{level: 1}`) as a "temporary client reference" instead of inline
    // data — the server then can't read `attrs` at all (throws "cannot dot
    // into a temporary client reference"), and worse, `attrs` silently
    // serializes to nothing when written to the DB, dropping heading
    // levels/image src+alt entirely. Cloning through JSON here, while still
    // on the client, produces a genuinely plain object with no such
    // boundary-crossing baggage.
    onUpdate: ({ editor }) => schedule(JSON.parse(JSON.stringify(editor.getJSON()))),
    onBlur: () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    },
  });

  if (!editor) return null;

  return (
    <>
      {editable ? (
        <Toolbar editor={editor} status={status} docId={docId} />
      ) : (
        <div className="dl-viewonly">
          <Eye size={15} />
          <span>
            <strong style={{ color: 'var(--color-body)', fontWeight: 600 }}>View only.</strong> Ask{' '}
            {ownerFirstName ?? 'the owner'} for edit access.
          </span>
        </div>
      )}
      <div className="dl-canvas">
        <div className="dl-sheet">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}
