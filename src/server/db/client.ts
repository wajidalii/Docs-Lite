import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from './schema';

// Reuse a single Pool across hot-reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __docslitePool?: Pool };

const pool = globalForDb.__docslitePool ?? new Pool({ connectionString: env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForDb.__docslitePool = pool;

export const db = drizzle(pool, { schema });

/** Close the pool (used by scripts / integration tests so the process can exit). */
export async function closeDb() {
  await pool.end();
}
