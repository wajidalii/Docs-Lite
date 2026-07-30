import 'server-only';
import { hashPassword, verifyPassword } from '@/lib/password';
import * as userRepo from '@/server/repositories/userRepo';
import { insertWorkspace } from '@/server/repositories/workspaceRepo';
import type { UserRow } from '@/server/db/schema';

/** User-facing auth error (bad credentials, email taken, etc.). Generic on purpose — never reveals whether the email or the password was wrong. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signUpUser(email: string, password: string, name: string): Promise<UserRow> {
  const existing = await userRepo.findUserByEmail(email);
  if (existing) throw new AuthError('An account with that email already exists');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.createUser(email, name, passwordHash);
  // Every user gets a personal workspace from day one (tdd.md §7.7) so
  // document creation always has somewhere to go.
  await insertWorkspace(user.id, `${name}'s Workspace`);
  return user;
}

export async function signInUser(email: string, password: string): Promise<UserRow> {
  const user = await userRepo.findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError('Invalid email or password');
  }
  return user;
}
