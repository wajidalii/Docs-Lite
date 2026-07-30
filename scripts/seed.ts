import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { SEED_USERS, SEED_USER_PASSWORD } from '../src/lib/users';
import { hashPassword } from '../src/lib/password';
import { users, workspaces, workspaceMembers } from '../src/server/db/schema';

config({ path: '.env.local' });

// Fixed UUIDs (same convention as SEED_USERS) so re-running the seed script
// is idempotent via onConflictDoNothing on the primary key.
const PERSONAL_WORKSPACE_IDS: Record<string, string> = {
  [SEED_USERS[0].id]: 'aaaaaaaa-1111-4111-8111-111111111111', // Alice
  [SEED_USERS[1].id]: 'aaaaaaaa-2222-4222-8222-222222222222', // Bob
  [SEED_USERS[2].id]: 'aaaaaaaa-3333-4333-8333-333333333333', // Carol
  [SEED_USERS[3].id]: 'aaaaaaaa-4444-4444-8444-444444444444', // Dave
};
const DEMO_WORKSPACE_ID = 'dddddddd-0000-4000-8000-000000000000';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (check .env.local)');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const passwordHash = await hashPassword(SEED_USER_PASSWORD);

  await db
    .insert(users)
    .values(SEED_USERS.map((u) => ({ id: u.id, email: u.email, name: u.name, passwordHash })))
    .onConflictDoNothing();

  // Every user has a personal workspace (mirrors authService.signUpUser).
  await db
    .insert(workspaces)
    .values(SEED_USERS.map((u) => ({ id: PERSONAL_WORKSPACE_IDS[u.id], name: `${u.name}'s Workspace`, ownerId: u.id })))
    .onConflictDoNothing();

  // Plus one shared workspace so the sharing/workspace-switcher demo has
  // more than one member out of the box. Alice owns it (implicit, no member
  // row for her); Bob is admin, Carol/Dave are members.
  const [alice, bob, carol, dave] = SEED_USERS;
  await db
    .insert(workspaces)
    .values({ id: DEMO_WORKSPACE_ID, name: 'DocsLite Demo', ownerId: alice.id })
    .onConflictDoNothing();
  await db
    .insert(workspaceMembers)
    .values([
      { workspaceId: DEMO_WORKSPACE_ID, userId: bob.id, role: 'admin' },
      { workspaceId: DEMO_WORKSPACE_ID, userId: carol.id, role: 'member' },
      { workspaceId: DEMO_WORKSPACE_ID, userId: dave.id, role: 'member' },
    ])
    .onConflictDoNothing();

  console.log(`Seeded ${SEED_USERS.length} users: ${SEED_USERS.map((u) => u.name).join(', ')}`);
  console.log(`Demo password (all seeded accounts): ${SEED_USER_PASSWORD}`);
  console.log('Seeded personal workspaces + shared "DocsLite Demo" workspace');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
