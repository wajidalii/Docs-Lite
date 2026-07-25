'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { zTiptapDoc, zTitle, zUuid } from '@/lib/validation';
import * as svc from '@/server/services/documentService';

export async function createDoc() {
  const user = await requireUser();
  const id = await svc.createDocument(user.id);
  redirect(`/documents/${id}`);
}

export async function renameDoc(id: string, title: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  const parsedTitle = zTitle.safeParse(title);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };
  if (!parsedTitle.success) return { ok: false as const, error: parsedTitle.error.issues[0].message };

  await svc.renameDocument(parsedId.data, user.id, parsedTitle.data);
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

  // Persist the ORIGINAL content object (not the parsed result) so nothing is stripped.
  await svc.saveDocumentContent(parsedId.data, user.id, content);
  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function deleteDoc(id: string) {
  const user = await requireUser();
  const parsedId = zUuid.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: 'Invalid document id' };

  await svc.deleteDocumentForUser(parsedId.data, user.id);
  revalidatePath('/');
  redirect('/');
}
