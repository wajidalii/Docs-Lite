# Technical Design Document — Collaborative Document Editor ("DocsLite")

**Ajaia LLC Take-Home | AI-Native Full Stack Developer**
**Status:** LOCKED — single source of truth for the original take-home build; see Amendment Log below for decisions superseded since
**Author:** Tech Lead | **Date:** 2026-07-25
**Timebox:** 4–6 hours to a deployed, testable live slice

---

## Amendment Log

**2026-07-28 — Auth: seeded pick-login → real email/password.** The original
locked decision (§2 "Out of scope", §3 stack table, §7.1) was that auth would
be a demo-only seeded pick-login with no credentials, appropriate for the
take-home timebox. The project is now being evolved as an ongoing product
beyond the take-home, and real signup/login is needed. Decision: implement
email/password auth (hashed with Node's built-in `scrypt`, no OAuth/magic-link
for now), while keeping the 4 seeded demo users — now with a real, documented
password — so the sharing demo still works out of the box. `iron-session`
and its cookie mechanics are unchanged; only how identity is established
(credential check vs. list-pick) changes. §7.1 below is updated in place to
describe the current behavior; §2/§3 retain the original rationale with a
pointer here.

---

## 1. Overview & Goals

DocsLite is a Google-Docs-lite collaborative rich-text editor: users create, edit, format, and share documents that persist across refresh. It ships as a single Next.js 16 App Router (**TypeScript everywhere** — app code, config, scripts, tests; no `.js`) application — frontend + backend via Server Actions and route handlers — backed by Postgres. **Runs locally first** against a Dockerized Postgres (Docker Compose); Neon + Vercel are the eventual deploy target and are **deferred** (see §13.B).

**Primary goal:** Ship the strongest **working, locally-runnable** vertical slice within the timebox. Running locally (`docker compose up -d` + `npm run dev`), a user must be able to: pick a seeded user, create/rename/format/save/reopen a document, upload a `.txt`/`.md` file into a new editable document, share a document with another user, and observe "My Documents" vs "Shared with me" — all surviving a hard refresh.

**Non-goals (this build):** real-time multiplayer/CRDT, production auth, file archival, arbitrary font sizing, comments, version history, **deployment (deferred)**.

**Guiding principle:** Local reliability and access-control correctness outrank polish. Vertical-slice-first: create/edit/save/reopen + sharing + persistence must **work end-to-end locally by ~hour 3** on plain component defaults, before any theming. Deployment is deferred; the app stays deploy-ready (all config env-driven) so shipping later is a config step, not a rewrite.

---

## 2. Scope — In / Out

### In scope (build)
- **Seeded pick-login** (4 users) with real HttpOnly encrypted session + one-click user switcher.
- **Documents CRUD**: create, rename (inline), edit, autosave, reopen, delete.
- **Rich text**: bold, italic, underline, headings H1/H2/H3 + paragraph (the "text-size" interpretation), bulleted + numbered lists — all via Tiptap StarterKit.
- **File upload**: `.txt` and `.md` → new editable document. `.docx` is **flag-gated stretch, cut-first**.
- **Sharing**: owner grants access by user (viewer/editor role), lists collaborators, changes role, **revokes**; "My Documents" vs "Shared with me" split.
- **Persistence**: documents + shares survive refresh; formatting round-trips losslessly (JSON storage).
- **Access control**: single server-only DAL enforcing owner/editor/viewer on every read/write.
- **Quality**: README (setup/run/deploy), Vitest access-control test, architecture note, AI-workflow note.

### Out of scope (deliberate cuts)
| Cut | One-line justification |
|---|---|
| Real-time multiplayer / CRDT | Debounced last-write-wins is honest for a single-user-at-a-time demo; CRDT eats the whole timebox. |
| Production auth (passwords/OAuth) | *(Superseded 2026-07-28 — see Amendment Log — email/password auth has been implemented.)* Originally: auth is a supporting requirement; seeded pick-login gives a real server session with one-click switching, ideal for demoing sharing. |
| `.docx` upload (default off) | `mammoth` + DOM shim + sanitize is the riskiest piece; `.txt`/`.md` fully satisfies the required feature. |
| Arbitrary font-size dropdown | Prompt says "headings/text-size"; H1/H2/H3 satisfies it without a custom TextStyle+FontSize mark. |
| Original-file archival (Blob) | Spec asks for an editable doc, not file storage; parse-on-upload removes a whole storage service. |
| Comments, version history, export | Not required; out of timebox. |
| Playwright E2E | Browser install + serverless cold-start flakiness for zero incremental rubric points; one manual smoke instead. |

### What we'd build next
1. `.docx` import (mammoth → sanitized HTML → `generateJSON` via `@tiptap/html`).
2. ~~Real auth (Better Auth) + real per-user document ownership.~~ Done 2026-07-28 — email/password auth shipped directly (scrypt + iron-session) rather than adopting Better Auth; per-user document ownership was already real.
3. Real-time collaboration via Tiptap + Yjs/Hocuspocus.
4. Comments, presence cursors, version history, share-by-link with expiry.

---

## 3. Locked Tech Stack

| Concern | Chosen | Version | Runner-up | Why |
|---|---|---|---|---|
| Framework | Next.js (App Router, TS, Turbopack) | `^16.2` | Remix | Locked constraint; stable Server Actions + Turbopack; one app = FE+BE. |
| Language/types | TypeScript / @types/node | `^5.9` / `^24` | — | Pin against sandbox bleeding-edge (TS 7.x / node 26) that breaks Next 16 build. |
| UI runtime | React / React-DOM | `^19` | — | Next 16 baseline. |
| Rich-text editor | Tiptap (`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm`) | `3.28.0` | Lexical | StarterKit ships bold/italic/**underline**/headings/lists; ProseMirror-grade; least code. |
| Editor content format | ProseMirror/Tiptap **JSON** in `jsonb` | — | HTML string | Lossless round-trip; no stored-HTML XSS; read-only render via `editable:false`. |
| ORM | Drizzle ORM | `0.45.2` | Prisma | No engine binary, no `prisma generate` postinstall, fast cold start, committed SQL migrations. |
| DB driver | **node-postgres** (`pg`) via `drizzle-orm/node-postgres` | `^8` | neon-http (deploy) | Standard TCP Postgres — **one** driver works for both local Docker Postgres now and Neon later (just swap the connection string). No dual-driver code, no rewrite at deploy. |
| Local database | **Docker Compose** Postgres | `16-alpine` | — | Reproducible local DB; `docker compose up -d`. No cloud account needed to build/test. |
| Migrations | drizzle-kit CLI (`generate` + `migrate`) | `0.31.10` (dev) | — | Committed SQL; runs against local Docker Postgres over `pg`. |
| DB (deploy target, deferred) | Neon serverless Postgres | free tier | — | Eventual host only; same schema + `pg` driver via its pooled connection string. |
| Validation | Zod | `4.4.3` | — | Shared client+server schemas; server is authoritative boundary. |
| Auth/session | iron-session | `8.0.4` | Auth.js v5 (beta) | Encrypted HttpOnly cookie, one env var, App-Router native, no beta lib on live deploy. Identity check as of 2026-07-28 is real email/password (Node `crypto.scrypt` hash) — see Amendment Log; cookie mechanics unchanged. |
| Markdown parse | `@tiptap/markdown` | `3.28.0` | marked→generateJSON | Official CommonMark parse straight to Tiptap JSON server-side, **no DOM needed**. |
| `.docx` (stretch) | `mammoth` | `1.12.0` | — | Only if time remains; needs `@tiptap/html` + sanitize + Node runtime. |
| Sanitizer (HTML paths only) | `isomorphic-dompurify` | `^3.19.0` | sanitize-html | Only for `.docx`/raw-HTML paths; patched DOMPurify ≥3.3.2 (CVE-2026-0540). |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | `4.3.x` | — | CSS-first `@theme`; build-time only; no runtime style engine. |
| Components | shadcn/ui (Radix) | CLI latest | Mantine | Owned, readable, accessible primitives (Dialog/Tabs/Select). |
| Doc typography | `@tailwindcss/typography` (`prose`) | latest | — | Professional canvas typography, near-zero CSS. |
| Toasts | sonner | latest | shadcn toast (deprecated) | Current shadcn-recommended toast. |
| Icons | lucide-react | latest | — | Ships with shadcn; one size/stroke. |
| Fonts | Inter via `next/font` (self-hosted) | — | — | No runtime external request; free. |
| Testing | Vitest (+ RTL conditional) | `4.1.x` | Jest | ESM-native, fast, near-zero config; access-control unit test. |
| Path alias in tests | `vite-tsconfig-paths` | `6.1.x` | — | `@/*` resolution — #1 Vitest snag. |
| Deploy | Vercel free tier | — | — | Locked constraint. |

**Corrections adopted from red-team:** Underline is in StarterKit v3 by default — **do NOT** add `@tiptap/extension-underline`. `@tiptap/markdown` parses to JSON with **no DOM shim** on the `.md` path. Version pins use **caret ranges** for framework packages (avoid nonexistent exact-patch install failure); exact pins kept for editor/ORM where the red-team verified them. Migrations run **out-of-band**, never in the Vercel build.

### 3.1 Pre-flight verifications
Two load-bearing claims were verified against live docs (2026-07-25) and hold:
- **Underline ∈ StarterKit v3** — confirmed new-in-v3; no separate underline extension needed. Source: Tiptap StarterKit docs.
- **`@tiptap/markdown` `MarkdownManager.parse()` runs server-side (no DOM)** — confirmed official bidirectional-markdown package. Source: Tiptap Markdown API docs.

Confirm at scaffold time (versions drift on npm; do a `npm view <pkg> version` before pinning): `next`, `@tiptap/react`+`starter-kit`+`pm`+`markdown` (keep all four on the **same** version), `drizzle-orm`, `drizzle-kit`, `pg`+`@types/pg`, `iron-session`, `zod`, `vitest`. If any exact patch in §3 is unavailable, take the nearest published patch of the same minor. **Fallback if `@tiptap/markdown` API differs:** `marked` → HTML → `isomorphic-dompurify` → `generateJSON` from `@tiptap/html` (needs a Node DOM shim; second choice only).

---

## 4. System Architecture

### 4.1 Layered request flow

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (Client Components: Tiptap editor, toolbar, dialogs)      │
│    forms / onUpdate (debounced) ──POST──▶                          │
└───────────────────────────────────┬──────────────────────────────┘
                                     │  Server Action / Route Handler (Node runtime)
                                     ▼
        ┌────────────────────────────────────────────────┐
        │  BOUNDARY: Zod.parse(input)  ──fail──▶ typed {error}│
        │           getCurrentUser() from iron-session cookie │
        └───────────────────────────────┬────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────┐
        │  SERVICE LAYER (business rules + authorization)  │
        │   documentService / sharingService               │
        │   ──▶ requireDocAccess(docId, userId, minRole)   │  ◀── the single door
        │        (throws 403/notFound before any I/O)      │
        └───────────────────────────────┬────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────┐
        │  REPOSITORY LAYER (Drizzle queries only, no auth)│
        │   documentRepo / shareRepo                       │
        └───────────────────────────────┬────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────┐
        │  DB CLIENT  drizzle(neon(env.DATABASE_URL))       │
        └───────────────────────────────┬────────────────────┘
                                         ▼
                            ┌────────────────────────┐
                            │  NEON POSTGRES (pooled) │
                            └────────────────────────┘
```

**Rules:** Server Actions/route handlers are **thin** (parse, resolve user, call service, `revalidatePath`, return typed result). All authorization lives in the **service layer** via `requireDocAccess`. Repositories never accept a `documentId` without a `userId`. `getCurrentUser()` reads userId **only** from the signed cookie — never a param/header/body.

### 4.2 Folder structure (commit exactly this)

```
app/
  layout.tsx                      # root, fonts, providers, Toaster
  page.tsx                        # dashboard: My Documents + Shared with me
  login/page.tsx                  # seeded-user picker
  documents/[id]/page.tsx         # editor page (server: load doc + effectiveRole)
  api/upload/route.ts             # POST file upload (runtime='nodejs')
  actions/
    auth.ts                       # signInAs(userId), signOut()
    documents.ts                  # createDoc, renameDoc, saveDoc, deleteDoc
    sharing.ts                    # shareDoc, changeRole, revokeShare
src/
  server/
    services/
      documentService.ts          # business rules + requireDocAccess
      sharingService.ts
    repositories/
      documentRepo.ts             # Drizzle queries
      shareRepo.ts
    db/
      client.ts                   # drizzle(pool) — node-postgres Pool from env.DATABASE_URL
      schema.ts                   # tables
  lib/
    env.ts                        # Zod-validated env (DATABASE_URL, SESSION_PASSWORD)
    session.ts                    # iron-session config + getCurrentUser()
    users.ts                      # 4 seeded users (id,name,email,initials)
    access.ts                     # PURE canView/canEdit/canManage(doc,shares,userId)
    validation.ts                 # shared Zod schemas
    editor/
      extensions.ts               # SINGLE shared Tiptap extensions array
    upload/
      parse.ts                    # parseUpload(filename,text) -> Tiptap JSON
      validate.ts                 # validateUpload({name,size,type})
components/
  editor/Editor.tsx               # 'use client' Tiptap (editable prop)
  editor/Toolbar.tsx
  dashboard/DocList.tsx
  dashboard/ShareDialog.tsx
  dashboard/UserSwitcher.tsx
  ui/                             # shadcn components (owned)
drizzle/                          # generated SQL migrations (committed)
tests/
  access.test.ts                  # MEANINGFUL rubric test
  parse.test.ts                   # upload round-trip fidelity
  validation.test.ts
docker-compose.yml                # local Postgres 16 (Docker)
.env.example                      # DATABASE_URL, SESSION_PASSWORD
next.config.ts
drizzle.config.ts                 # TS + dotenv
vitest.config.ts
scripts/seed.ts                   # inserts 4 seeded users (run via tsx)
```
Every source, config, and script file is `.ts`/`.tsx` — no `.js` anywhere.

### 4.3 Zod validation placement
One schema per action/entity in `src/lib/validation.ts`, imported by **both** client forms (UX) and server actions (trust boundary). Server validation is authoritative. Every action/route calls `.parse()` **before** touching the service/DB and returns a typed `{ ok:false, error }` on failure.

---

## 5. Data Model

Drizzle schema in `src/server/db/schema.ts`. Postgres. Content stored as **`jsonb`** (Tiptap JSON). Role uses **`text` + CHECK** (not pgEnum) to avoid `ALTER TYPE` pain.

```ts
import { pgTable, uuid, text, jsonb, timestamp, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled'),
  content: jsonb('content').notNull(),                     // Tiptap ProseMirror JSON
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx: index('documents_owner_idx').on(t.ownerId),
}));

export const documentShares = pgTable('document_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  sharedWithUserId: uuid('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),                            // 'viewer' | 'editor'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqShare: unique('doc_shares_doc_user_uniq').on(t.documentId, t.sharedWithUserId),
  sharedWithIdx: index('doc_shares_shared_with_idx').on(t.sharedWithUserId),
  roleCheck: check('doc_shares_role_check', sql`${t.role} in ('viewer','editor')`),
}));
```

### Owner vs share rows — explained
- **Ownership is implicit** in `documents.owner_id`. There is **never** an owner row in `document_shares`. This makes self-shares structurally impossible, prevents an owner from being accidentally un-shared, and removes an owner/share sync class of bugs.
- **Effective role** is computed at query time: `owner` if `owner_id = me`, else the `role` from the matching share row, else `null` → denied.
- **`unique(document_id, shared_with_user_id)`** prevents duplicate grants and backs the permission join; re-sharing does an upsert (`onConflictDoNothing`/`DO UPDATE SET role`).
- **Indexes:** `documents_owner_idx` powers "My Documents"; `doc_shares_shared_with_idx` powers "Shared with me"; the unique index powers the permission lookup.

### Effective-role query (single, indexed, DB-side filter)
```sql
SELECT d.*,
       CASE WHEN d.owner_id = $me THEN 'owner' ELSE s.role END AS effective_role
FROM documents d
LEFT JOIN document_shares s
  ON s.document_id = d.id AND s.shared_with_user_id = $me
WHERE d.id = $docId;
-- effective_role NULL  => throw notFound (no owner, no share)
```

**Seeded users** live in code (`src/lib/users.ts`) AND are inserted into the `users` table by `scripts/seed.ts` so FKs resolve. Fixed UUIDs so `users.ts` ids match DB rows.

---

## 6. API / Server Surface

All mutations are **Server Actions** except file upload (route handler for multipart). Every entry point: `Zod.parse` → `getCurrentUser()` → service `requireDocAccess` → repo. `minRole` legend: **viewer** = read, **editor** = write content, **owner** = rename/share/revoke/delete.

| Method / Kind | Path or Action | Purpose | Auth / permission check | Input (Zod) | Output |
|---|---|---|---|---|---|
| Action | `signInAs(userId)` | Set session to seeded user | userId ∈ seeded list | `{ userId: uuid }` | redirect `/` |
| Action | `signOut()` | Destroy session | session exists | — | redirect `/login` |
| Server load | `GET /` (page) | Dashboard lists | `getCurrentUser()` (401→`/login`) | — | `{ myDocs[], sharedDocs[] }` DTOs |
| Action | `createDoc()` | New empty doc (owner=me) | authenticated | — | `{ id }` → redirect `/documents/[id]` |
| Server load | `GET /documents/[id]` (page) | Load doc + effectiveRole | `requireDocAccess(id, me, 'viewer')` | route `id: uuid` | `{ id,title,content,effectiveRole }` DTO |
| Action | `renameDoc(id,title)` | Rename | `requireDocAccess(id, me, 'owner')` | `{ id: uuid, title: string(1..200) }` | `{ ok, title }` |
| Action | `saveDoc(id,content)` | Autosave content | `requireDocAccess(id, me, 'editor')` | `{ id: uuid, content: TiptapJson }` | `{ ok, updatedAt }` |
| Action | `deleteDoc(id)` | Delete | `requireDocAccess(id, me, 'owner')` | `{ id: uuid }` | `{ ok }` → redirect `/` |
| Action | `shareDoc(id,email,role)` | Grant/upsert access | `requireDocAccess(id, me, 'owner')` | `{ id: uuid, email, role }` | `{ ok, collaborators[] }` |
| Action | `changeRole(id,userId,role)` | Change collaborator role | `requireDocAccess(id, me, 'owner')` | `{ id, userId, role }` | `{ ok, collaborators[] }` |
| Action | `revokeShare(id,userId)` | Remove collaborator | `requireDocAccess(id, me, 'owner')` | `{ id: uuid, userId: uuid }` | `{ ok, collaborators[] }` |
| Server load | `listCollaborators(id)` | Who has access | `requireDocAccess(id, me, 'viewer')` | `{ id: uuid }` | `{ collaborators: [{userId,name,role}] }` |
| Route (POST) | `/api/upload` (`runtime='nodejs'`) | File → new doc | `getCurrentUser()`; validate before parse | multipart `file` | `{ id }` or `4xx {error}` |

**Zod shared types:** `role = z.enum(['viewer','editor'])`; `email = z.string().email()`; `TiptapJson = z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })` (shape guard, not full schema).

`shareDoc` rejects sharing to self (`target === owner_id`) and to a non-existent email with a clear validation error. Returns generic **notFound** (not 403) on unauthorized access to avoid existence leakage.

---

## 7. Feature Specs

### 7.1 Auth (email/password + iron-session)
**Behavior (updated 2026-07-28 — see Amendment Log; original seeded pick-login spec is below for historical reference):**
`/login` renders an email + password form calling `signIn(email, password)`. `/signup` renders an email + password + name form calling `signUp(email, password, name)`. Both verify/hash the password with Node's built-in `crypto.scrypt` against the `users.password_hash` column, then write the encrypted HttpOnly cookie `docs_session = { userId }` → redirect `/`. Header shows current user + "Sign out" → `/login`. Session config unchanged: `{ password: env.SESSION_PASSWORD, cookieName: 'docs_session', cookieOptions: { httpOnly: true, secure: NODE_ENV==='production', sameSite: 'lax' } }`. The 4 seeded demo users (Alice, Bob, Carol, Dave) still exist with a documented password so the sharing demo works without creating new accounts.

**Acceptance criteria:**
- [ ] `getCurrentUser()` reads userId only from the decrypted cookie, then loads the user from the DB; returns null if absent or the user no longer exists.
- [ ] Unauthenticated request to `/` or any doc action → redirect `/login` / 401.
- [ ] `signIn` rejects wrong email/password with one generic error (no user-enumeration via distinct error messages).
- [ ] `signUp` rejects an email already in use.
- [ ] `secure` is false in dev (local http works), true in production.
- [ ] Signing in as a different seeded user's credentials changes which docs appear in My vs Shared without a second browser.
- [ ] README documents the 4 demo accounts' emails + password for the sharing demo.

<details>
<summary>Original spec (superseded 2026-07-28)</summary>

**Behavior:** `/login` renders 4 seeded users (Alice, Bob, Carol, Dave) as clickable cards. Clicking calls `signInAs(userId)` → writes encrypted HttpOnly cookie `docs_session = { userId }` → redirect `/`. Header shows current user + "Switch user" → `/login`. Session config: `{ password: env.SESSION_PASSWORD, cookieName: 'docs_session', cookieOptions: { httpOnly: true, secure: NODE_ENV==='production', sameSite: 'lax' } }`.

**Acceptance criteria:**
- [ ] `getCurrentUser()` reads userId only from the decrypted cookie; returns null if absent.
- [ ] Unauthenticated request to `/` or any doc action → redirect `/login` / 401.
- [ ] `signInAs` rejects a userId not in the seeded list.
- [ ] `secure` is false in dev (local http works), true in production.
- [ ] Switching user changes which docs appear in My vs Shared without a second browser.
- [ ] README + login page label this as an intentional demo login.

</details>

### 7.2 Documents (CRUD + rename)
**Behavior:** Create → empty doc titled "Untitled" owned by me → open editor. Rename inline in toolbar (save on blur/Enter). Delete (owner only). Reopen loads stored JSON.

**Acceptance criteria:**
- [ ] `createDoc` inserts with `ownerId = currentUser`, empty valid doc JSON.
- [ ] `renameDoc` persists; reflects after refresh; owner-only.
- [ ] `deleteDoc` cascades shares; owner-only; redirects to `/`.
- [ ] Opening a doc I can't access returns notFound.

### 7.3 Editor (formatting + autosave + serialization)
**Behavior:** `'use client'` Tiptap with `immediatelyRender:false`, `if (!editor) return null` guard, single shared extensions array. Uncontrolled: `content` seeded once at init; doc switching via React `key={documentId}`. Toolbar: Bold, Italic, Underline, H1/H2/H3, Paragraph, Bullet list, Numbered list — active state from `editor.isActive(...)`; disabled when `!editor || !editor.isEditable`. Autosave: `editor.on('update')` debounced ~800ms, single in-flight promise (queue latest, flush on resolve), also flush on blur. Status indicator: **Saving… / Saved / Save failed — retry**.

**Acceptance criteria:**
- [ ] Editor mounts without hydration/act warning.
- [ ] All required marks/nodes toggle and persist.
- [ ] `getJSON()` on save, `content: json` on load → deep-equal round-trip; no marks dropped after refresh.
- [ ] Autosave never issues save N+1 before N resolves (no out-of-order overwrite).
- [ ] Failed save shows explicit failure state, never silent "Saved".
- [ ] Viewer role → `editable:false`, no toolbar.

### 7.4 File Upload
**Behavior:** Upload entry (button/input) accepting `.txt, .md` (stated in UI). POST multipart to `/api/upload` (`runtime='nodejs'`). Server: `validateUpload` (extension allowlist + size cap ≤1MB) **before** parse → `file.text()` → `.md` via `@tiptap/markdown` `MarkdownManager.parse()` using the **shared extensions**; `.txt` split on blank lines into plain paragraph nodes (never markdown-parsed) → insert new doc owned by me → redirect to editor. Empty/whitespace-only files produce at least one valid paragraph node.

**Acceptance criteria:**
- [ ] `.txt`/`.md` accepted; other extensions and >1MB rejected with a clear 4xx + toast.
- [ ] `# H1\n\n- a\n- b\n\n**bold**` → JSON contains heading, bulletList/listItem, and bold mark (nothing dropped).
- [ ] `.txt` with `#`/`-` lines stays literal paragraph text.
- [ ] Empty file yields a mountable doc, not an invalid/empty ProseMirror doc.
- [ ] Uploaded doc is a normal editable document (reuses all CRUD/share paths).

### 7.5 Sharing
**Behavior:** Owner opens Share dialog: enter collaborator email + role (Can view / Can edit); see current collaborators list with role; change role; revoke. Upsert on `(documentId, sharedWithUserId)`. "My Documents" = `owner_id = me`; "Shared with me" = join `document_shares` where `shared_with_user_id = me`. Both derived from the same DB source of truth.

**Acceptance criteria:**
- [ ] After share, target user sees doc in **Shared with me**; owner sees it in **My Documents**.
- [ ] Re-sharing changes role instead of erroring (upsert).
- [ ] Revoke removes the collaborator; revoked user's Shared list no longer shows it and `requireDocAccess` denies next call.
- [ ] Sharing to self or unknown email → clear validation error.
- [ ] Viewer cannot save; editor can; only owner can share/revoke/rename/delete.

### 7.6 Persistence
**Behavior:** Server is source of truth. Mutations return discriminated `{ ok }`/`{ error }`; client reflects success only after server confirms. On refresh, always re-fetch from DB. `updatedAt` written every save.

**Acceptance criteria:**
- [ ] Create → format → share → hard refresh → content + share survive from DB.
- [ ] No reliance on localStorage/optimistic-only state.
- [ ] Persist failure surfaces a toast; never a false "Saved".

---

## 8. UI/UX Spec

### 8.1 Pages / routes
- `/login` — seeded-user picker.
- `/` — dashboard: sidebar (New document, My Documents, Shared with me, user switcher) + empty canvas / prompt.
- `/documents/[id]` — three-zone editor.

### 8.2 Layout (three zones, single screen)
- **Left sidebar** (260px, surface bg, right border): wordmark + "New document" primary button; two sections "My Documents" / "Shared with me" (each row = title + relative timestamp; active row = left accent bar + tinted bg); **user switcher** at bottom.
- **Top toolbar** (sticky, 56px): left = inline editable title + autosave status; center = `[H1 H2 H3 P] | [Bold Italic Underline] | [Bullet Numbered]` with vertical `Separator` dividers; right = **Share** button + upload entry.
- **Writing canvas**: centered `.prose` column, max-width 760px, white sheet on `#F7F8FA`, soft shadow.

### 8.3 Component list (add lazily, only what renders)
`Button`, `Dialog` (share), `Tabs` or two sidebar groups, `Input`, `Select` (role), `Separator`, `sonner` Toaster, plus custom `Editor`, `Toolbar`, `DocList`, `ShareDialog`, `UserSwitcher`. **Defer/skip** tooltip, avatar, skeleton (pure polish).

### 8.4 Exact color palette (light mode, WCAG-AA)
| Token | Hex |
|---|---|
| App background | `#F7F8FA` |
| Surface (sheet/sidebar/toolbar) | `#FFFFFF` |
| Surface muted (hover/rows) | `#F1F3F5` |
| Border / dividers | `#E4E7EC` |
| Text primary | `#1A2027` |
| Text secondary/muted | `#667085` |
| Primary / accent | `#2563EB` |
| Primary hover | `#1D4ED8` |
| Primary tint (active row/selection) | `#EFF4FF` |
| Success (Saved) | `#16A34A` |
| Danger (delete/errors) | `#DC2626` |
| Focus ring | `#2563EB` @ 40%, 2px offset |

shadcn variable mapping: `--primary=#2563EB`, `--background=#F7F8FA`, `--card/--popover=#FFFFFF`, `--muted=#F1F3F5`, `--border/--input=#E4E7EC`, `--foreground=#1A2027`, `--muted-foreground=#667085`, `--ring=#2563EB`.

### 8.5 Typography
Inter (self-hosted via `next/font`). UI base 14px; sidebar rows 14/500; doc title 15/600; canvas body 16/1.7 (prose); H1 30/700, H2 24/600, H3 20/600. Radius `--radius: 0.5rem` (8px). One shadow token: `0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.10)`.

### 8.6 Key states
- **Empty:** "No documents yet — create one or upload a .txt/.md."
- **Loading:** simple text/spinner (skeleton shimmer cut).
- **Error:** single sonner toast with retry.
- **Upload:** show accepted types ".txt, .md" on the control (drag-over ring cut).

### 8.7 Demo user flow
1. Open live URL → `/login`. 2. Click **Alice** → dashboard (empty). 3. **New document** → type + format (bold/H1/list) → autosave "Saved". 4. Rename inline. 5. **Share** → enter Bob's email, role "Can edit". 6. **Switch user** → Bob (or second incognito window) → doc under **Shared with me** → edit persists. 7. Hard refresh → content + share intact.

**README instructs reviewers to demo sharing across two browser windows / one normal + one incognito** so both sides are visible simultaneously; same-browser switch is the convenience path.

---

## 9. Security & Access Control

### 9.1 The single authorization pattern (enforced on every doc read/write)
```
route/action
  → Zod.parse(input)                       // reject malformed BEFORE query
  → userId = getCurrentUser()              // ONLY from signed iron-session cookie
  → requireDocAccess(documentId, userId, minRole)   // server-only, one indexed query
       - runs the effective_role query (WHERE includes userId → DB-side filter)
       - effective_role NULL → throw notFound (generic; no existence leak)
       - rank(effective_role) < rank(minRole) → throw notFound
  → repository call
```
- `requireDocAccess` and `getCurrentUser` live in `src/lib/session.ts` / service layer with `import 'server-only'` — never bundled to client. `getCurrentUser` memoized with React `cache()`.
- **Every** Server Action and route handler is treated as a public POST-able endpoint and re-verifies. **Middleware is not a security boundary** (CVE-2025-29927); no auth logic in middleware.
- Pure `access.ts` (`canView/canEdit/canManage(doc, shares, userId)`) holds the rank logic; the DAL is a thin adapter that loads data and calls it. This is what the meaningful test targets.
- **No** service/repo function accepts a client-supplied `userId`; it always comes from the session.
- Both list queries include `userId` in the SQL `WHERE` — never fetch-all-then-filter-in-JS.

**Operation → minRole matrix (single source of truth):**
| Operation | minRole |
|---|---|
| open / read / list collaborators | viewer |
| save content | editor |
| rename / share / changeRole / revoke / delete | owner |

### 9.2 Upload safety
- Route handler `runtime='nodejs'`; validate extension allowlist + size ≤1MB with Zod **before** parsing any bytes.
- `.txt`/`.md` only (default). `.docx` flag-gated; if enabled, sanitize mammoth HTML with `isomorphic-dompurify` (Node runtime) **before** `generateJSON` (imported from `@tiptap/html`).
- Content persisted as JSON built only from the known shared schema → no arbitrary nodes; shared docs rendered via Tiptap `editable:false`, **never** `dangerouslySetInnerHTML`.

### 9.3 Auth/session handling
- Env guard (`src/lib/env.ts`): Zod-validate `DATABASE_URL` (present, valid `postgres://` URL) and `SESSION_PASSWORD` (≥32 chars) at import; throw a clear named error if missing. (Neon-specific pooled/`sslmode=require` assertions are added only when we wire the deferred deploy target — §13.B.)
- Cookie: HttpOnly always; `secure` only in production; `sameSite:lax`.
- Open pick-login is labeled an intentional demo tradeoff in README + UI.

---

## 10. Test Plan (test-first)

**Tooling:** Vitest `4.1.x` + `vite-tsconfig-paths`. Default `environment: 'node'` (access/parse/validation tests need no DOM). Scripts: `"test":"vitest run"`, `"test:watch":"vitest"`. Playwright **excluded** from `npm test`. Add `@testing-library/react` + jsdom via a `test.projects` jsdom entry **only if** a component test is written (do **not** use the removed `environmentMatchGlobs`).

**Write order (red → green):**

| # | Layer | Asserts |
|---|---|---|
| **1 ⭐ MEANINGFUL** | unit (`access.test.ts`) | `access.ts` rank logic: **owner allowed all; shared-viewer read yes / write no; shared-editor write yes; non-shared/non-owner denied on all; revoked user denied**. Pure, no DB/HTTP. This is the rubric "meaningful" test — it protects the app's core security invariant. |
| 2 | unit (`access.test.ts`) | `requireDocAccess` throws notFound when effective_role is null; enforces minRole ranking (viewer rejected on write path). |
| 3 | unit (`parse.test.ts`) | Upload round-trip: `# H1\n\n- a\n- b\n\n**bold**` → JSON has heading + bulletList/listItem + bold mark (schema-drift guard). |
| 4 | unit (`parse.test.ts`) | `.txt` with `#`/`-` stays literal paragraphs; empty/whitespace file → ≥1 valid paragraph node (never invalid doc). |
| 5 | unit (`validation.test.ts`) | Zod: valid create/rename/share pass; empty title, bad email, oversized upload, self-share rejected. |
| 6 | unit | `validateUpload`: oversized rejected, disallowed extension rejected, `.txt`/`.md` accepted. |
| 7 | integration (optional) | Route handler / action with mocked repo returns notFound when access denies, 200 when allowed (proves wiring). |
| 8 | manual smoke (README) | Create → format → share → hard-refresh → content + share survive on the **live URL**. |

---

## 11. Risk Register

| Risk | L/I | Early warning | Preventive decision | Mitigation |
|---|---|---|---|---|
| Missing/wrong `DATABASE_URL` (local or deploy) | H/H | Every request 500s | Single Zod env guard throws named error on import; `.env.example` documents the exact local string | Local: `postgres://docs:docs@localhost:5432/docs` after `docker compose up -d`. Deploy (deferred): pooled `-pooler` + `?sslmode=require` in both Vercel envs. |
| Migrations run in build / at request time | M/H | Partial/failed schema, races | Runbook: migrate **out-of-band** via CLI; never in build/handlers; commit SQL | `drizzle-kit generate` (commit) → `drizzle-kit migrate` against the local (or, later, Neon) DB before running |
| Node `pg` driver on edge runtime | M/H | Runtime throw importing db/session | `pg` is Node-only — never `runtime='edge'` on anything touching db/session; keep middleware db/session-free | Node runtime everywhere; `runtime='nodejs'` on upload route |
| Docker Postgres not running / port 5432 taken | M/M | `ECONNREFUSED` on migrate/dev | README lists `docker compose up -d` as step 1; note port conflict | Free the port or remap in `docker-compose.yml`; `docker compose ps` to confirm healthy |
| TS/@types version drift breaks Vercel build | M/H | Clean install fails in CI, passes locally | Pin `typescript ^5.9`, `@types/node ^24`; commit lockfile | Clean `npm install` + `next build` locally before first push |
| SSR hydration mismatch (Tiptap) | H/H | React hydration error, blank/dup editor | `immediatelyRender:false` + `if(!editor)return null` from first commit | Leaf client component; smoke-mount test |
| Extension-set drift drops formatting | H/H | Uploaded/reopened doc silently loses marks | Single shared `extensions.ts`; forbid inline `extensions:[]` | Round-trip fidelity test (#3) fails loudly on divergence |
| Missing `SESSION_PASSWORD` in Vercel | M/H | iron-session crashes on first login | Same env guard, ≥32-char check | Set in Vercel both envs before first deploy |
| IDOR / access bypass | H/H | User opens another's doc by id | Pure `access.ts` first; DAL the only door; `WHERE` includes userId | Meaningful test (#1); notFound on deny |
| Client-supplied identity spoofing | M/H | POST as any user succeeds | No function accepts `userId` param; read from cookie only | 401 without session; switcher writes cookie server-side |
| Out-of-order autosave overwrite | M/H | Latest keystrokes lost | Single in-flight promise, queue latest | `updatedAt` stamp; serialize saves client-side |
| Upload oversized/wrong-type → opaque 413/500 | M/M | Reviewer upload fails cryptically | Validate before parse; size cap; state types in UI | Clear 4xx + toast; `.docx` cut-first |
| Stored/rendered XSS via imported HTML | M/H | Script executes in collaborator session | JSON-only persistence; no `dangerouslySetInnerHTML`; shared extensions | Sanitize (`isomorphic-dompurify` ≥3.19) only on `.docx`/HTML path, Node runtime |
| Neon cold-start after idle (deploy-time only) | L/L | Slow first request | Deploy-time concern; N/A for local Docker | Accept; well within Hobby timeout when deployed |

---

## 12. Implementation Plan (test-first, hour-by-hour)

**Checkpoint discipline:** vertical slice + sharing **working end-to-end locally by ~hour 3** on plain shadcn defaults; theming/polish last and skippable. Deployment is deferred (§13.B).

### Hour 0–0.75 — Scaffold + local DB skeleton
- `create-next-app` (App Router, **TypeScript**, Tailwind). Pin `typescript ^5.9`, `@types/node ^24`. Install Drizzle + `pg` + `@types/pg` + zod + iron-session + Tiptap (`react`, `starter-kit`, `pm`) + `@tiptap/markdown` + Vitest + `vite-tsconfig-paths` + `tsx` + `dotenv`.
- `docker-compose.yml` (Postgres 16-alpine) → `docker compose up -d`. `.env.example` + `.env.local` (`DATABASE_URL=postgres://docs:docs@localhost:5432/docs`, `SESSION_PASSWORD`).
- `src/lib/env.ts` Zod guard. `drizzle.config.ts` (TS, dotenv). Schema (§5). `drizzle-kit generate` → commit SQL → `drizzle-kit migrate` against local Docker DB. `scripts/seed.ts` → seed 4 users. **Done:** `npm run dev` renders a placeholder page reading from the Dockerized DB; every file `.ts`/`.tsx`.

### Hour 0.75–1.5 — Auth + access core (TEST FIRST)
- Write `tests/access.test.ts` (#1, #2) → red. Implement pure `access.ts` + `requireDocAccess` → green.
- `src/lib/session.ts` (iron-session, `getCurrentUser`), `src/lib/users.ts`, `signInAs`/`signOut`, `/login` picker, `UserSwitcher`. **Done:** log in as Alice, session enforced, access test green.

### Hour 1.5–2.5 — Documents CRUD + editor
- `documentRepo` + `documentService` (authz). `createDoc`, `renameDoc`, `saveDoc`, `deleteDoc`, dashboard `/` with My/Shared lists (Shared empty for now).
- `src/lib/editor/extensions.ts` (StarterKit, heading `[1,2,3]`, no separate underline). `Editor.tsx` (`immediatelyRender:false`, `key={id}`, `editable` prop) + `Toolbar.tsx`. Debounced single-in-flight autosave + status. **Done:** create/edit/format/save/reopen works locally.

### Hour 2.5–3.25 — Sharing (the graded centerpiece)
- `shareRepo` (upsert `onConflictDoNothing`/role update, revoke, list) + `sharingService` (owner-only). `shareDoc`/`changeRole`/`revokeShare`/`listCollaborators`. `ShareDialog`. Wire "Shared with me". **Done:** full share/revoke loop working locally end-to-end by ~hour 3 (verify by switching users in a second browser window).

### Hour 3.25–4 — File upload
- `validateUpload` + `parse.test.ts` (#3,#4) red → `parse.ts` (`@tiptap/markdown` for `.md`, paragraph split for `.txt`) green. `/api/upload` route (`runtime='nodejs'`, validate→parse→insert). Upload UI stating `.txt, .md`. **Done:** upload → editable doc, tests green.

### Hour 4–5 — Hardening + validation + theme
- `validation.test.ts` (#5,#6). Discriminated result types + sonner error toasts. Empty state. Apply exact-hex palette via `@theme` (~15 min, skippable). Persistence hard-refresh smoke on local dev.

### Hour 5–6 — Docs + buffer
- README (setup/run **with Docker**, env vars, migrate + seed steps, supported upload types, demo-two-windows note, scope cuts). Architecture note + AI-workflow note. `.docx` only if time remains. Final `npm test` + clean-install `npm run build` locally verify.

---

## 13. Runbooks

### 13.A Local Dev Runbook (Docker) — the path we use now

**Prereqs:** Node 22.12+ / 24, Docker Desktop.

**`docker-compose.yml`** (Postgres 16):
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: docs
      POSTGRES_PASSWORD: docs
      POSTGRES_DB: docs
    ports: ['5432:5432']
    volumes: ['docsdb:/var/lib/postgresql/data']
volumes:
  docsdb: {}
```

**Env (`.env.local`, copied from committed `.env.example`):**
| Name | Value (local) | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://docs:docs@localhost:5432/docs` | plain TCP, no SSL locally |
| `SESSION_PASSWORD` | ≥32 chars (`openssl rand -base64 32`) | iron-session encryption key |

**Steps (first run):**
```bash
docker compose up -d            # start local Postgres
npm install
cp .env.example .env.local      # then fill SESSION_PASSWORD
npx drizzle-kit generate        # emit + COMMIT SQL to ./drizzle
npx drizzle-kit migrate         # apply schema to local DB
npx tsx scripts/seed.ts         # seed 4 users
npm run dev                     # http://localhost:3000
npm test                        # Vitest (access-control + parse + validation)
```
**Reset DB:** `docker compose down -v && docker compose up -d`, then migrate + seed again.

### 13.B Deployment (deferred — reference only)
Not doing this now. The app stays deploy-ready because all config is env-driven and the `pg` driver also connects to Neon's pooled endpoint (no code change). When we deploy: create a Neon project; set `DATABASE_URL` to its **pooled** (`-pooler`, `?sslmode=require`) string + `SESSION_PASSWORD` in Vercel (Production **and** Preview); run `drizzle-kit migrate` + seed **out-of-band** (never in the Vercel build); keep Build Command = plain `next build`; ensure nothing touching db/session uses `runtime='edge'`; then tighten the §9.3 env guard to assert the pooled/SSL string. Node 22.12+/24 in Vercel.

### 13.C First-run checklist (local)
- [ ] `docker compose up -d` healthy (`docker compose ps`); port 5432 free.
- [ ] `.env.local` has `DATABASE_URL` + `SESSION_PASSWORD` (≥32 chars); env guard passes.
- [ ] `drizzle-kit migrate` applied; `scripts/seed.ts` inserted 4 users; a trivial `SELECT` works.
- [ ] `npm run dev`: log in as Alice, create/format/save a doc, share with Bob (2nd browser window), hard-refresh — all survive.
- [ ] `npm test` green.
- [ ] Every source/config/script file is `.ts`/`.tsx` — **no `.js`**.
- [ ] Nothing touching db/session uses `runtime='edge'`; upload route is `runtime='nodejs'`.
- [ ] Node 22.12+/24; `typescript ^5.9`, `@types/node ^24` pinned; clean `npm install` + `npm run build` pass.

---

## 14. Deliverables Checklist

| Ajaia requirement | Where it lives |
|---|---|
| Documents: create/rename/edit rich text/save/reopen | `app/documents/[id]/page.tsx`, `components/editor/*`, `app/actions/documents.ts` |
| Rich text: bold/italic/underline/headings/text-size/bullet+numbered | Tiptap StarterKit via `src/lib/editor/extensions.ts` + `Toolbar.tsx` |
| File upload `.txt`/`.md` → editable doc | `app/api/upload/route.ts`, `src/lib/upload/{validate,parse}.ts`; types stated in upload UI + README |
| Sharing + My vs Shared distinction | `app/actions/sharing.ts`, `sharingService`, `ShareDialog`, dashboard `/` |
| Persistence survives refresh, formatting preserved | `jsonb` content, JSON round-trip, `documentRepo`, DB re-fetch on load |
| Access/authorization logic | `src/lib/access.ts` + `requireDocAccess` (DAL) |
| Setup/run instructions (local, Docker) | `README.md` + `docker-compose.yml` + `.env.example` |
| Live deploy (testable URL) | **Deferred** — app is deploy-ready (env-driven, `pg` works with Neon); local run fully documented. §13.B has the deploy steps for later. |
| Validation + error handling | Shared Zod (`src/lib/validation.ts`), discriminated results, sonner toasts, env guard |
| ≥1 meaningful automated test | `tests/access.test.ts` (⭐ access-control), plus `parse`/`validation` tests |
| Architecture note | `README.md` (layers, JSON persistence, neon-http, cold-start note) |
| AI-workflow note | `README.md` (research→red-team→TDD workflow, tool usage) |