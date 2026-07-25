'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { isSeededUserId } from '@/lib/users';

export async function signInAs(userId: string) {
  if (!isSeededUserId(userId)) {
    throw new Error('Unknown user');
  }
  const session = await getSession();
  session.userId = userId;
  await session.save();
  redirect('/');
}

export async function signOut() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
