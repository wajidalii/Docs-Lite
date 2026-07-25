import StarterKit from '@tiptap/starter-kit';

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
