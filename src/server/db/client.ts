import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from './schema';

// Reuse a single Pool across hot-reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __docslitePool?: Pool };

const pool = globalForDb.__docslitePool ?? new Pool({ connectionString: env.DATABASE_URL, keepAlive: true });
if (process.env.NODE_ENV !== 'production') globalForDb.__docslitePool = pool;

// REQUIRED: node-postgres emits 'error' on the pool when an idle client's
// connection dies underneath it (e.g. Neon terminating an idle backend on
// compute auto-suspend — Postgres error 57P01). With no listener, that's an
// uncaught exception that crashes the whole process, taking down whatever
// else that warm serverless instance was handling. The pool already discards
// the dead client on its own; this just stops the crash. See
// https://node-postgres.com/apis/pool#error
pool.on('error', (err) => {
  console.error('[db] idle client error (pool recovers automatically):', err);
});

export const db = drizzle(pool, { schema });

/** Close the pool (used by scripts / integration tests so the process can exit). */
export async function closeDb() {
  await pool.end();
}
