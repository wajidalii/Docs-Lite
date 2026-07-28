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
    onUpdate: ({ editor }) => schedule(editor.getJSON()),
    onBlur: () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    },
  });

  if (!editor) return null;

  return (
    <>
      {editable ? (
        <Toolbar editor={editor} status={status} />
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
