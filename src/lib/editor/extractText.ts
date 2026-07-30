// Plain-text extraction from a Tiptap/ProseMirror JSON doc, for full-text
// search indexing (documents.content_text, see schema.ts). `content` is
// `unknown` everywhere in the service layer (only shape-guarded by
// zTiptapDoc), so this walks defensively and never throws on malformed input.
export function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { text?: unknown; attrs?: { alt?: unknown }; content?: unknown };

  const parts: string[] = [];
  if (typeof n.text === 'string') parts.push(n.text);
  if (typeof n.attrs?.alt === 'string') parts.push(n.attrs.alt);
  if (Array.isArray(n.content)) {
    for (const child of n.content) parts.push(extractText(child));
  }
  return parts.filter(Boolean).join(' ');
}
