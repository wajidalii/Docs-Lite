import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { SEED_USERS } from '../src/lib/users';
import { users } from '../src/server/db/schema';

config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (check .env.local)');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  await db
    .insert(users)
    .values(SEED_USERS.map((u) => ({ id: u.id, email: u.email, name: u.name })))
    .onConflictDoNothing();

  console.log(`Seeded ${SEED_USERS.length} users: ${SEED_USERS.map((u) => u.name).join(', ')}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
