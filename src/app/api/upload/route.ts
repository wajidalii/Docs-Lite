import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { validateUpload } from '@/lib/upload/validate';
import { parseUpload } from '@/lib/upload/parse';
import { createDocumentWithContent } from '@/server/services/documentService';
import { uploadRateLimit, RateLimitError } from '@/server/services/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    uploadRateLimit(user.id);
  } catch (err) {
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    throw err;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate BEFORE reading any bytes.
  const check = validateUpload({ name: file.name, size: file.size });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const text = await file.text();
  const { title, content } = parseUpload(file.name, text);
  const id = await createDocumentWithContent(user.id, title, content);

  return NextResponse.json({ id }, { status: 201 });
}
