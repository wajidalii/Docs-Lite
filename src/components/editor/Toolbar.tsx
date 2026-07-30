'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  ListTodo,
  Link2,
  Code2,
  Image as ImageIcon,
  Table,
  Columns3,
  Rows3,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { showToast } from '@/lib/toast';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const CODE_LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'xml', label: 'HTML/XML' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
];

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

export function Toolbar({ editor, status, docId }: { editor: Editor; status: SaveStatus; docId: string }) {
  const c = () => editor.chain().focus();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Lets the slash-command menu's "Image" item reuse this upload flow without
  // needing to know about the document id itself.
  useEffect(() => {
    const dom = editor.view.dom;
    const openPicker = () => {
      if (!uploadingImage) imageInputRef.current?.click();
    };
    dom.addEventListener('docslite:trigger-image-upload', openPicker);
    return () => dom.removeEventListener('docslite:trigger-image-upload', openPicker);
  }, [editor, uploadingImage]);

  const setLink = () => {
    const previousUrl = (editor.getAttributes('link').href as string | undefined) ?? '';
    const url = window.prompt('Link URL', previousUrl);
    if (url === null) return;
    if (url.trim() === '') {
      c().extendMarkRange('link').unsetLink().run();
      return;
    }
    c().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const onImageChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
      showToast('error', 'Only PNG, JPEG, GIF, and WebP images are supported.');
      return;
    }
    if (file.size > 4_000_000) {
      showToast('error', 'That image is over 4MB — try a smaller one.');
      return;
    }

    setUploadingImage(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`/api/documents/${docId}/images`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        c().setImage({ src: data.url, alt: file.name }).run();
        return;
      }
      showToast('error', data.error ?? 'Image upload failed. Try that file again.');
    } catch {
      showToast('error', 'Image upload failed. Try that file again.');
    } finally {
      setUploadingImage(false);
    }
  };

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
      <Btn label="Link" active={editor.isActive('link')} onClick={setLink}>
        <Link2 size={16} />
      </Btn>
      <Btn
        label="Insert image"
        active={false}
        onClick={() => !uploadingImage && imageInputRef.current?.click()}
      >
        {uploadingImage ? <span className="dl-spinner" style={{ width: 14, height: 14 }} /> : <ImageIcon size={16} />}
      </Btn>
      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onImageChosen} />

      <Btn label="Code block" active={editor.isActive('codeBlock')} onClick={() => c().toggleCodeBlock().run()}>
        <Code2 size={16} />
      </Btn>
      {editor.isActive('codeBlock') && (
        <select
          className="dl-tb-select"
          aria-label="Code block language"
          value={(editor.getAttributes('codeBlock').language as string | null) ?? 'plaintext'}
          onChange={(e) => c().updateAttributes('codeBlock', { language: e.target.value }).run()}
        >
          {CODE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      )}

      <span className="dl-tb-sep" />

      <Btn
        label="Insert table"
        active={false}
        onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table size={16} />
      </Btn>
      {editor.isActive('table') && (
        <>
          <Btn label="Add column after" active={false} onClick={() => c().addColumnAfter().run()}>
            <Columns3 size={16} />
          </Btn>
          <Btn label="Delete column" active={false} onClick={() => c().deleteColumn().run()}>
            <Columns3 size={16} strokeWidth={1} />
          </Btn>
          <Btn label="Add row after" active={false} onClick={() => c().addRowAfter().run()}>
            <Rows3 size={16} />
          </Btn>
          <Btn label="Delete row" active={false} onClick={() => c().deleteRow().run()}>
            <Rows3 size={16} strokeWidth={1} />
          </Btn>
          <Btn label="Delete table" active={false} onClick={() => c().deleteTable().run()}>
            <Trash2 size={16} />
          </Btn>
        </>
      )}

      <span className="dl-tb-sep" />

      <Btn label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>
        <List size={16} />
      </Btn>
      <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </Btn>
      <Btn label="Task list" active={editor.isActive('taskList')} onClick={() => c().toggleTaskList().run()}>
        <ListTodo size={16} />
      </Btn>

      <Status status={status} />
    </div>
  );
}
