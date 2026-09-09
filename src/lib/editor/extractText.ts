// Plain-text extraction from a Tiptap/ProseMirror JSON doc, for full-text
// search indexing (documents.content_text, see schema.ts). `content` is
// `unknown` everywhere in the service layer (only shape-guarded by
// zTiptapDoc), so this walks defensively and never throws on malformed input.
//
// Only touch `attrs` on image nodes (the only node type where `alt` is
// meaningful) — reading `attrs` on other node types is not just pointless,
// it can throw. A heading's `attrs` (e.g. `{level: 1}`) arrives through the
// Server Action boundary as a React "temporary client reference" object;
// merely accessing a property on it throws "Cannot access X on the server.
// You cannot dot into a temporary client reference from a server
// component," which previously made every autosave containing a heading
// fail outright.
export function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { type?: unknown; text?: unknown; attrs?: { alt?: unknown }; content?: unknown };

  const parts: string[] = [];
  if (typeof n.text === 'string') parts.push(n.text);
  if (n.type === 'image' && typeof n.attrs?.alt === 'string') parts.push(n.attrs.alt);
  if (Array.isArray(n.content)) {
    for (const child of n.content) parts.push(extractText(child));
  }
  return parts.filter(Boolean).join(' ');
}
