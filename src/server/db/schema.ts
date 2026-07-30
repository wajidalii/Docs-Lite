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
    // Two-step migration (0006 nullable -> scripts/backfill-workspaces.ts ->
    // 0007 NOT NULL, see tdd.md §5.1) so existing rows get backfilled before
    // the constraint lands. Workspace membership is organizational only
    // (tdd.md §7.7) — it does not gate document access, only creation +
    // dashboard grouping.
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('Untitled'),
    content: jsonb('content').notNull(), // Tiptap / ProseMirror JSON
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('documents_owner_idx').on(t.ownerId), index('documents_workspace_idx').on(t.workspaceId)],
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

// Periodic content snapshots (throttled, see documentService.saveDocumentContent)
// plus an unthrottled one written right before a restore, so restoring never
// destroys the state that preceded it.
export const documentVersions = pgTable(
  'document_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: jsonb('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [index('document_versions_document_created_idx').on(t.documentId, t.createdAt)],
);

// Workspaces are organizational only — they group documents on the
// dashboard and gate who may create documents / manage membership. They are
// NOT a document-level access boundary: requireDocAccess and per-document
// sharing by email are unaffected (tdd.md §7.7).
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'member' | 'admin'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('workspace_members_ws_user_uniq').on(t.workspaceId, t.userId),
    index('workspace_members_user_idx').on(t.userId),
    check('workspace_members_role_check', sql`${t.role} in ('member','admin')`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type DocumentShareRow = typeof documentShares.$inferSelect;
export type DocumentImageRow = typeof documentImages.$inferSelect;
export type DocumentVersionRow = typeof documentVersions.$inferSelect;
export type WorkspaceRow = typeof workspaces.$inferSelect;
export type WorkspaceMemberRow = typeof workspaceMembers.$inferSelect;
