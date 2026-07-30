'use client';

// Notion-style "/" block-insertion menu. Schema-neutral (inserts only nodes
// already registered by the shared `extensions` array) but view-only — it
// needs ReactRenderer + DOM/floating-ui positioning, so like Placeholder it's
// added to `editorExtensions` (client-only), never to the schema array shared
// with the server-side MarkdownManager (src/lib/editor/extensions.ts).

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState, type ComponentType } from 'react';
import { Extension, type Range } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  ListTodo,
  Table as TableIcon,
  Code2,
  Image as ImageIcon,
} from 'lucide-react';

type SlashItem = {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  command: (props: { editor: Editor; range: Range }) => void;
};

const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Paragraph',
    description: 'Plain body text',
    icon: Pilcrow,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('paragraph').run(),
  },
  {
    title: 'Bulleted list',
    description: 'Unordered list of items',
    icon: List,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Ordered list of items',
    icon: ListOrdered,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Task list',
    description: 'Checkboxes to track to-dos',
    icon: ListTodo,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: TableIcon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Code block',
    description: 'Syntax-highlighted code',
    icon: Code2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Image',
    description: 'Upload and embed an image',
    icon: ImageIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Toolbar owns the actual upload flow (needs the document id); it
      // listens for this event on the editor DOM to open its file picker.
      editor.view.dom.dispatchEvent(new CustomEvent('docslite:trigger-image-upload'));
    },
  },
];

type SlashListRef = { onKeyDown: (props: SuggestionKeyDownProps) => boolean };

const SlashCommandList = forwardRef<SlashListRef, SuggestionProps<SlashItem>>((props, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [props.items]);

  const select = useCallback(
    (index: number) => {
      const item = props.items[index];
      if (item) props.command(item);
    },
    [props],
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowDown') {
          setSelected((s) => (props.items.length ? (s + 1) % props.items.length : 0));
          return true;
        }
        if (event.key === 'ArrowUp') {
          setSelected((s) => (props.items.length ? (s - 1 + props.items.length) % props.items.length : 0));
          return true;
        }
        if (event.key === 'Enter') {
          select(selected);
          return true;
        }
        return false;
      },
    }),
    [props.items, selected, select],
  );

  if (props.items.length === 0) {
    return <div className="dl-slash-menu dl-slash-empty">No matching blocks</div>;
  }

  return (
    <div className="dl-slash-menu">
      {props.items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          className="dl-slash-item"
          data-selected={i === selected ? 'true' : undefined}
          onMouseEnter={() => setSelected(i)}
          onClick={() => select(i)}
        >
          <item.icon size={16} />
          <span className="dl-slash-text">
            <span className="dl-slash-title">{item.title}</span>
            <span className="dl-slash-desc">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
});
SlashCommandList.displayName = 'SlashCommandList';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        items: ({ query }: { query: string }) =>
          SLASH_ITEMS.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) => {
          props.command({ editor, range });
        },
        render: () => {
          let component: ReactRenderer<SlashListRef, SuggestionProps<SlashItem>>;
          let unmount: (() => void) | undefined;

          return {
            onStart: (props: SuggestionProps<SlashItem>) => {
              component = new ReactRenderer(SlashCommandList, { props, editor: props.editor });
              if (!props.clientRect) return;
              unmount = props.mount(component.element);
            },
            onUpdate: (props: SuggestionProps<SlashItem>) => {
              component.updateProps(props);
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                unmount?.();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
