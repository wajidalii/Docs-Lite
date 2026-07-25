'use client';

import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, List, ListOrdered, Check, AlertCircle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function Btn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="dl-tb-btn"
      data-active={active ? 'true' : undefined}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Status({ status }: { status: SaveStatus }) {
  if (status === 'idle') return <span className="dl-tb-status" data-status="idle" aria-live="polite" />;
  return (
    <span className="dl-tb-status" data-status={status} aria-live="polite">
      {status === 'saving' && (
        <>
          <span className="dl-spinner" style={{ width: 12, height: 12 }} /> Saving…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={14} className="ic" /> Saved
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={14} /> Save failed — keep typing to retry
        </>
      )}
    </span>
  );
}

export function Toolbar({ editor, status }: { editor: Editor; status: SaveStatus }) {
  const c = () => editor.chain().focus();
  return (
    <div className="dl-toolbar">
      <Btn label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <Btn label="Paragraph" active={editor.isActive('paragraph')} onClick={() => c().setParagraph().run()}>
        P
      </Btn>

      <span className="dl-tb-sep" />

      <Btn label="Bold" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}>
        <Bold size={16} />
      </Btn>
      <Btn label="Italic" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}>
        <Italic size={16} />
      </Btn>
      <Btn label="Underline" active={editor.isActive('underline')} onClick={() => c().toggleUnderline().run()}>
        <Underline size={16} />
      </Btn>

      <span className="dl-tb-sep" />

      <Btn label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>
        <List size={16} />
      </Btn>
      <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </Btn>

      <Status status={status} />
    </div>
  );
}
