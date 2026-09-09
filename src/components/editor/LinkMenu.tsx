'use client';

// Link interactions layered on top of the shared Link mark (extensions.ts).
// `openOnClick: false` on that mark is deliberate — clicking must not
// navigate away while editing — so this is what makes links interactive
// again: hovering shows a URL preview, and placing the cursor in a link
// (which a plain click already does) shows a small menu to open or edit it.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { ExternalLink, Pencil } from 'lucide-react';

function getHref(editor: Editor): string {
  return (editor.getAttributes('link').href as string | undefined) ?? '';
}

function openInNewTab(href: string) {
  if (href) window.open(href, '_blank', 'noopener,noreferrer');
}

// Click-driven menu: Tiptap's BubbleMenu shows based on selection state,
// which is exactly what "cursor lands inside a link" (a plain click)
// already produces — no manual click handling needed.
function LinkClickMenu({ editor, editable }: { editor: Editor; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [href, setHref] = useState('');
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      setEditing(false);
      setHref(getHref(editor));
    };
    sync();
    editor.on('selectionUpdate', sync);
    return () => {
      editor.off('selectionUpdate', sync);
    };
  }, [editor]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const confirmEdit = () => {
    const trimmed = draft.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (trimmed === '') chain.unsetLink().run();
    else chain.setLink({ href: trimmed }).run();
    setEditing(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkClickMenu"
      shouldShow={({ editor }) => editor.isActive('link')}
      className="dl-link-menu"
    >
      {editing ? (
        <form
          className="dl-link-menu-row"
          onSubmit={(e) => {
            e.preventDefault();
            confirmEdit();
          }}
        >
          <input
            ref={inputRef}
            className="dl-link-menu-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            placeholder="https://…"
          />
          <button type="submit" className="dl-link-menu-btn dl-link-menu-btn-primary">
            Save
          </button>
        </form>
      ) : (
        <div className="dl-link-menu-row">
          <span className="dl-link-menu-url">{href}</span>
          <button
            type="button"
            className="dl-link-menu-btn"
            onClick={() => openInNewTab(href)}
            aria-label="Open link in new tab"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
          {editable && (
            <button
              type="button"
              className="dl-link-menu-btn"
              onClick={() => {
                setDraft(href);
                setEditing(true);
              }}
              aria-label="Edit link"
              title="Edit link"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      )}
    </BubbleMenu>
  );
}

// Pure hover preview — independent of selection/cursor, so it's driven by
// plain mouseover/mouseout on the editor DOM rather than Tiptap state.
function LinkHoverPreview({ editor }: { editor: Editor }) {
  const [hover, setHover] = useState<{ href: string; anchor: HTMLElement } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dom = editor.view.dom;

    const onOver = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      setHover({ href: anchor.getAttribute('href') ?? '', anchor });
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('a[href]')) setHover(null);
    };

    dom.addEventListener('mouseover', onOver);
    dom.addEventListener('mouseout', onOut);
    return () => {
      dom.removeEventListener('mouseover', onOver);
      dom.removeEventListener('mouseout', onOut);
    };
  }, [editor]);

  useEffect(() => {
    if (!hover || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    return autoUpdate(hover.anchor, tooltip, () => {
      computePosition(hover.anchor, tooltip, {
        strategy: 'fixed',
        placement: 'top',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
      });
    });
  }, [hover]);

  if (!hover) return null;

  return createPortal(
    <div ref={tooltipRef} className="dl-link-tooltip" role="tooltip">
      {hover.href}
    </div>,
    document.body,
  );
}

export function LinkMenu({ editor, editable }: { editor: Editor; editable: boolean }) {
  return (
    <>
      <LinkClickMenu editor={editor} editable={editable} />
      <LinkHoverPreview editor={editor} />
    </>
  );
}
