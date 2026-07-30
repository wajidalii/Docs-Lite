const ALLOWED = ['txt', 'md'] as const;
const MAX_BYTES = 1_000_000; // ~1 MB

export type UploadExt = (typeof ALLOWED)[number];
export type UploadMeta = { name: string; size: number };
export type ValidateResult = { ok: true; ext: UploadExt } | { ok: false; error: string };

export function extname(name: string): string {
  const m = /\.([^./\\]+)$/.exec(name.toLowerCase());
  return m ? m[1] : '';
}

export function validateUpload(meta: UploadMeta): ValidateResult {
  const ext = extname(meta.name);
  if (!(ALLOWED as readonly string[]).includes(ext)) {
    return { ok: false, error: 'Only .txt and .md files are supported' };
  }
  if (meta.size > MAX_BYTES) {
    return { ok: false, error: 'File is too large (max 1MB)' };
  }
  return { ok: true, ext: ext as UploadExt };
}

const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
const MAX_IMAGE_BYTES = 4_000_000; // ~4 MB — stays under Vercel's request body cap

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type ImageMeta = { type: string; size: number };
export type ValidateImageResult = { ok: true; mimeType: ImageMimeType } | { ok: false; error: string };

export function validateImageUpload(meta: ImageMeta): ValidateImageResult {
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(meta.type)) {
    return { ok: false, error: 'Only PNG, JPEG, GIF, and WebP images are supported' };
  }
  if (meta.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image is too large (max 4MB)' };
  }
  return { ok: true, mimeType: meta.type as ImageMimeType };
}
