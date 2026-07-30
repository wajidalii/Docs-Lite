import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import { getImageForUser } from '@/server/services/imageService';
import { NotFoundError } from '@/server/services/access-control';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  if (!zUuid.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid image id' }, { status: 400 });
  }

  try {
    const image = await getImageForUser(id, user.id);
    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
}
