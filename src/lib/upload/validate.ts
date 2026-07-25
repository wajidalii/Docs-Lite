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
