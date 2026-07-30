import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, isNull, eq, asc } from 'drizzle-orm';
import { documents, workspaces, users } from '../src/server/db/schema';

config({ path: '.env.local' });

// One-off, out-of-band data migration (tdd.md §5.1): assigns every existing
// document (created before workspaces existed) to its owner's personal
// workspace, creating one if the owner doesn't already have one. Run this
// AFTER the migration that adds documents.workspace_id as nullable, and
// BEFORE the follow-up migration that tightens it to NOT NULL. Idempotent —
// safe to re-run (it only ever touches rows where workspace_id IS NULL).
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (check .env.local)');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const orphaned = await db
    .selectDistinct({ ownerId: documents.ownerId })
    .from(documents)
    .where(isNull(documents.workspaceId));

  if (orphaned.length === 0) {
    console.log('No documents without a workspace — nothing to backfill.');
    await pool.end();
    return;
  }

  for (const { ownerId } of orphaned) {
    const [existing] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.ownerId, ownerId))
      .orderBy(asc(workspaces.createdAt))
      .limit(1);

    let workspaceId = existing?.id;
    if (!workspaceId) {
      const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, ownerId));
      const [created] = await db
        .insert(workspaces)
        .values({ ownerId, name: `${owner?.name ?? 'Untitled'}'s Workspace` })
        .returning({ id: workspaces.id });
      workspaceId = created.id;
      console.log(`Created personal workspace for ${owner?.name ?? ownerId}`);
    }

    const result = await db
      .update(documents)
      .set({ workspaceId })
      .where(and(eq(documents.ownerId, ownerId), isNull(documents.workspaceId)));
    console.log(`Backfilled ${result.rowCount ?? 0} document(s) for owner ${ownerId} -> workspace ${workspaceId}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
