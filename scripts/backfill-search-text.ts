import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { documents } from '../src/server/db/schema';
import { extractText } from '../src/lib/editor/extractText';

config({ path: '.env.local' });

// One-off, out-of-band data migration: documents.content_text (search index
// source, see schema.ts's generated search_vector column) is only kept in
// sync going forward, on save (documentService.saveDocumentContent /
// createDocument*). Documents created before this feature shipped have an
// empty content_text until they're next edited — this backfills them from
// their existing jsonb content so they're searchable immediately. Run once,
// after the migration that adds content_text/search_vector. Safe to re-run.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (check .env.local)');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const rows = await db.select({ id: documents.id, content: documents.content }).from(documents);

  let updated = 0;
  for (const row of rows) {
    const contentText = extractText(row.content);
    await db.update(documents).set({ contentText }).where(eq(documents.id, row.id));
    updated += 1;
  }

  console.log(`Backfilled content_text for ${updated} document(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
