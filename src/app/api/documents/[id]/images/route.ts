import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import { validateImageUpload } from '@/lib/upload/validate';
import { uploadImageForDocument } from '@/server/services/imageService';
import { NotFoundError } from '@/server/services/access-control';
import { imageUploadRateLimit, RateLimitError } from '@/server/services/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  if (!zUuid.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
  }

  try {
    imageUploadRateLimit(user.id);
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
  const check = validateImageUpload({ type: file.type, size: file.size });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());

  try {
    const imageId = await uploadImageForDocument(id, user.id, check.mimeType, file.size, data);
    return NextResponse.json({ id: imageId, url: `/api/images/${imageId}` }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    throw err;
  }
}
