'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { zUuid } from '@/lib/validation';
import * as svc from '@/server/services/versionService';
import type { VersionSummary } from '@/server/services/versionService';
import { NotFoundError } from '@/server/services/access-control';

export type ListVersionsResult = { ok: true; versions: VersionSummary[] } | { ok: false; error: string };
export type RestoreVersionResult = { ok: true } | { ok: false; error: string };

export async function listVersions(id: string): Promise<ListVersionsResult> {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'Invalid document id' };

  try {
    const versions = await svc.listVersionsForUser(parsedId.data, user.id);
    return { ok: true, versions };
  } catch (err) {
    if (err instanceof NotFoundError) return { ok: false, error: 'Document not found' };
    throw err;
  }
}

export async function restoreVersion(id: string, versionId: string): Promise<RestoreVersionResult> {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  const parsedVersionId = zUuid.safeParse(versionId);
  if (!parsedId.success || !parsedVersionId.success) return { ok: false, error: 'Invalid request' };

  try {
    await svc.restoreVersionForUser(parsedId.data, user.id, parsedVersionId.data);
  } catch (err) {
    if (err instanceof NotFoundError) return { ok: false, error: 'Document or version not found' };
    throw err;
  }
  revalidatePath(`/documents/${parsedId.data}`);
  return { ok: true };
}
