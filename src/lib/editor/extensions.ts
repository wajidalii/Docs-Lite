import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

// The SINGLE shared extensions array. Both the client editor and the server-side
// markdown/upload parser MUST use this exact set so content round-trips without
// dropping marks. Do not inline `extensions: [...]` anywhere else.
//
// StarterKit v3 already includes: bold, italic, underline, headings, bullet &
// ordered lists (+ listKeymap), so no separate underline/list extensions.
export const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
];

// Client-editor-only composition: adds the Placeholder view decoration on top
// of the shared schema. Placeholder contributes no nodes/marks, so it never
// affects parsing/round-trip fidelity — kept out of `extensions` because that
// array is also fed to the server-side MarkdownManager, which has no view.
export const editorExtensions = [...extensions, Placeholder.configure({ placeholder: 'Start writing…' })];
