// Ensures a user-entered link URL has an explicit scheme before it's stored
// as a href. Without this, a bare domain like "wajidali.netlify.app" is
// stored literally, and both the rendered <a> and window.open() resolve it
// as a RELATIVE path against the current page (e.g.
// "https://docs-lite-xi.vercel.app/documents/wajidali.netlify.app") instead
// of an absolute external URL.
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') return '';
  // Already has a scheme (http:, https:, mailto:, tel:, ...) — leave as-is.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
