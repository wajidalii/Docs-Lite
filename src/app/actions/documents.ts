'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { resolveActiveWorkspaceId } from '@/lib/activeWorkspace';
import { zSearchQuery, zTiptapDoc, zTitle, zUuid } from '@/lib/validation';
import * as svc from '@/server/services/documentService';
import { NotFoundError } from '@/server/services/access-control';
import { RateLimitError } from '@/server/services/rate-limit';
import type { SearchResult } from '@/server/repositories/documentRepo';

function notFoundResult() {
  return { ok: false as const, error: 'Document not found' };
}

export type SearchDocsResult = { ok: true; results: SearchResult[] } | { ok: false; error: string };

export async function searchDocs(query: string): Promise<SearchDocsResult> {
  const user = await requireUser();
  const parsed = zSearchQuery.safeParse(query);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const results = await svc.searchDocuments(user.id, parsed.data);
  return { ok: true, results };
}

export async function createDoc() {
  const user = await requireUser();
  const workspaceId = await resolveActiveWorkspaceId(user.id);
  const id = await svc.createDocument(user.id, workspaceId);
  redirect(`/documents/${id}`);
}

export async function duplicateDoc(id: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };

  const workspaceId = await resolveActiveWorkspaceId(user.id);

  let newId: string;
  try {
    newId = await svc.duplicateDocumentForUser(parsedId.data, user.id, workspaceId);
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    throw err;
  }
  revalidatePath('/');
  redirect(`/documents/${newId}`);
}

export async function renameDoc(id: string, title: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  const parsedTitle = zTitle.safeParse(title);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };
  if (!parsedTitle.success) return { ok: false as const, error: parsedTitle.error.issues[0].message };

  try {
    await svc.renameDocument(parsedId.data, user.id, parsedTitle.data);
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    throw err;
  }
  revalidatePath(`/documents/${parsedId.data}`);
  revalidatePath('/');
  return { ok: true as const, title: parsedTitle.data };
}

export async function saveDoc(id: string, content: unknown) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };

  const shape = zTiptapDoc.safeParse(content);
  if (!shape.success) return { ok: false as const, error: 'Invalid document content' };

  try {
    // Persist the ORIGINAL content object (not the parsed result) so nothing is stripped.
    await svc.saveDocumentContent(parsedId.data, user.id, content);
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    if (err instanceof RateLimitError) return { ok: false as const, error: err.message };
    throw err;
  }
  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function deleteDoc(id: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };

  try {
    await svc.deleteDocumentForUser(parsedId.data, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    throw err;
  }
  revalidatePath('/');
  redirect('/');
}

export async function restoreDoc(id: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };

  try {
    await svc.restoreDocumentForUser(parsedId.data, user.id);
  } catch (err) {
    if (err instanceof NotFoundError) return notFoundResult();
    throw err;
  }
  revalidatePath('/trash');
  revalidatePath('/');
  return { ok: true as const };
}
