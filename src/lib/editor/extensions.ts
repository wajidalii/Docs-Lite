import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { SlashCommand } from './slash-command';

const lowlight = createLowlight(common);

// The SINGLE shared extensions array. Both the client editor and the server-side
// markdown/upload parser MUST use this exact set so content round-trips without
// dropping marks. Do not inline `extensions: [...]` anywhere else.
//
// StarterKit v3 already includes: bold, italic, underline, headings, bullet &
// ordered lists (+ listKeymap), so no separate underline/list extensions. Link
// is disabled on StarterKit and configured explicitly below so we control
// openOnClick (must be off while editing).
export const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: false,
    codeBlock: false,
  }),
  CodeBlockLowlight.configure({ lowlight }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
  }),
  TableKit.configure({
    table: { resizable: true },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Image,
];

// Client-editor-only composition: adds view-only decorations/plugins on top of
// the shared schema. Neither Placeholder nor SlashCommand contribute
// nodes/marks, so they never affect parsing/round-trip fidelity — kept out of
// `extensions` because that array is also fed to the server-side
// MarkdownManager, which has no view (SlashCommand needs ReactRenderer + DOM).
export const editorExtensions = [
  ...extensions,
  Placeholder.configure({ placeholder: 'Start writing…' }),
  SlashCommand,
];
