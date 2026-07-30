import { pgTable, uuid, text, jsonb, integer, timestamp, unique, index, check, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
});

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('Untitled'),
    content: jsonb('content').notNull(), // Tiptap / ProseMirror JSON
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('documents_owner_idx').on(t.ownerId)],
);

export const documentShares = pgTable(
  'document_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    sharedWithUserId: uuid('shared_with_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'viewer' | 'editor'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('doc_shares_doc_user_uniq').on(t.documentId, t.sharedWithUserId),
    index('doc_shares_shared_with_idx').on(t.sharedWithUserId),
    check('doc_shares_role_check', sql`${t.role} in ('viewer','editor')`),
  ],
);

// Uploaded images embedded in a document body, kept out of the jsonb content
// column — the editor references them by id (`/api/images/:id`), never inline.
export const documentImages = pgTable(
  'document_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    data: bytea('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('document_images_document_idx').on(t.documentId)],
);

export type UserRow = typeof users.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type DocumentShareRow = typeof documentShares.$inferSelect;
export type DocumentImageRow = typeof documentImages.$inferSelect;
