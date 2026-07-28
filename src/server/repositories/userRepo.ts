import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users, type UserRow } from '@/server/db/schema';

export async function findUserById(id: string): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
}

export async function createUser(email: string, name: string, passwordHash: string): Promise<UserRow> {
  const [user] = await db.insert(users).values({ email: email.toLowerCase(), name, passwordHash }).returning();
  return user;
}
