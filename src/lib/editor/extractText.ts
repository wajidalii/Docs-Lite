// Plain-text extraction from a Tiptap/ProseMirror JSON doc, for full-text
// search indexing (documents.content_text, see schema.ts). `content` is
// `unknown` everywhere in the service layer (only shape-guarded by
// zTiptapDoc), so this walks defensively and never throws on malformed input.
//
// `attrs` reads are wrapped in try/catch: a node's `attrs` object (a
// heading's `{level: 1}`, an image's `{src, alt}`, ...) can arrive through
// the Server Action boundary as a React "temporary client reference" —
// merely accessing a property on it throws "Cannot access X on the server.
// You cannot dot into a temporary client reference from a server
// component." That's happened for both headings and images in practice, so
// this treats any attrs read as fallible rather than trying to special-case
// which node types are "safe" — worst case we just miss indexing an image's
// alt text, instead of failing the whole save.
function readAlt(attrs: unknown): string | null {
  try {
    const alt = (attrs as { alt?: unknown } | null | undefined)?.alt;
    return typeof alt === 'string' ? alt : null;
  } catch {
    return null;
  }
}

export function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { type?: unknown; text?: unknown; attrs?: unknown; content?: unknown };

  const parts: string[] = [];
  if (typeof n.text === 'string') parts.push(n.text);
  if (n.type === 'image') {
    const alt = readAlt(n.attrs);
    if (alt) parts.push(alt);
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) parts.push(extractText(child));
  }
  return parts.filter(Boolean).join(' ');
}
