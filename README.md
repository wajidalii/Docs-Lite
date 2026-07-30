# DocsLite — a lightweight collaborative document editor

A Google-Docs-lite app: create, edit, and format rich-text documents, upload
`.txt`/`.md` files into new documents, organize them into workspaces, and share
documents with other users (viewer/editor roles). Built as a single
**Next.js 16** app (frontend + backend via Server Actions and route handlers)
on **Postgres**.

> Started as the Ajaia "AI-Native Full Stack Developer" take-home and is now
> being evolved as an ongoing product beyond that original scope (see
> `tdd.md`'s Amendment Log for what's changed and why). See
> [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) for how AI was used, [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> for design decisions, and [`tdd.md`](./tdd.md) for the full technical design.

## Features

- **Documents** — create, rename (inline), edit, autosave, reopen, soft-delete
  with a trash/restore view.
- **Rich text** — bold, italic, underline, links, headings + paragraph,
  bulleted/numbered/task lists, tables, images, syntax-highlighted code
  blocks, and a Notion-style `/` slash-command menu (Tiptap). Content is
  stored as JSON and round-trips losslessly.
- **Version history** — periodic autosave snapshots plus a manual restore
  (which itself snapshots the pre-restore state first, so nothing is lost).
- **File upload** — upload a `.txt` or `.md` file to create a new editable
  document. Markdown formatting is parsed; plain text stays literal.
- **Workspaces** — every user gets a personal workspace at signup; documents
  are grouped by workspace with a dashboard switcher. Organizational only —
  it doesn't gate document-level access.
- **Sharing** — a document owner grants another user access as **viewer** or
  **editor**, can change roles, and can revoke, with a workspace-member picker
  for convenience. The dashboard splits **My Documents** vs **Shared with me**.
- **Full-text search** — search title + body across every document you can
  access (Postgres `tsvector`, ranked).
- **Access control** — every read/write is authorized server-side through a
  single door; a user can never touch a document they don't own or aren't
  shared on (no IDOR).

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) — one app, FE + BE |
| Database | Postgres — Dockerized locally, Neon in production (`pg` driver, same connection code both places) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Editor | Tiptap v3 (StarterKit + Link/Table/TaskList/Image/CodeBlockLowlight/slash-command) — content stored as JSON in `jsonb` |
| Auth | iron-session (encrypted cookie) + email/password (Node `crypto.scrypt`) |
| Upload parsing | `@tiptap/markdown` (server-side, no DOM) |
| Validation | Zod (shared client + server) |
| Components | shadcn/ui (Radix) — incremental adoption; `Button`/`Input`/`Dialog` migrated so far, most components are still the original hand-built design system |
| Styling | Tailwind CSS v4 (`@theme` tokens) + custom design system; Instrument Sans / Source Serif 4 / Instrument Serif via `next/font`; `sonner` toasts |
| Tests | Vitest (unit + integration against real Postgres) + Playwright (e2e) |

## Design

The UI implements a high-fidelity design system (iris accent, warm-grey ground,
1px hairlines, and a **serif writing canvas** so a document reads like a document).
The design handoff lives in [`design/`](./design); the implemented result is
captured in [`screenshots/`](./screenshots) (`v2-*.png`, desktop + mobile).

## Prerequisites

- **Node.js 22.12+ or 24**
- **Docker Desktop** (for the local Postgres)

## Setup & run (local)

```bash
# 1. Start local Postgres (Docker)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Create your env file (works out of the box; change SESSION_PASSWORD if you like)
cp .env.example .env.local

# 4. Apply the database schema and seed demo users
npm run db:migrate
npm run db:seed

# 5. Run the app
npm run dev
# open http://localhost:3000  →  sign in as a demo user (see "Seeded demo users" below)
#   or create your own account at /signup
```

To reset the database: `npm run db:reset` then re-run `db:migrate` and `db:seed`.

## Environment variables

Copy `.env.example` → `.env.local`:

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (default points at the Docker DB) |
| `SESSION_PASSWORD` | ≥32-char key that encrypts the session cookie |

The app validates these at startup and fails fast with a clear message if either
is missing or invalid.

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (no DB required) |
| `npm run test:int` | Integration tests (requires the Docker DB up) |
| `npm run test:e2e` | Playwright e2e tests (requires the Docker DB up + migrated/seeded) |
| `npm run db:migrate` | Apply committed SQL migrations |
| `npm run db:seed` | Insert the 4 seeded users (+ their personal workspaces + a shared demo workspace) |
| `npm run db:backfill-workspaces` | One-off: assign pre-workspaces documents to a personal workspace. Only needed when upgrading a database created before workspaces existed — a fresh setup doesn't need this |
| `npm run db:backfill-search-text` | One-off: populate the full-text search index for documents that existed before search shipped. Same "only for upgrading an existing database" caveat |
| `npm run db:reset` | Drop & recreate the Docker DB volume |

## Seeded demo users

Sign in as any of these — password for all four is `docslite-demo`:

| Name | Email |
|---|---|
| Alice Kim | `alice@docslite.dev` |
| Bob Rivera | `bob@docslite.dev` |
| Carol Nasser | `carol@docslite.dev` |
| Dave Okoro | `dave@docslite.dev` |

You can also create your own account at `/signup`.

### Demoing the sharing flow

The quickest way to see both sides at once:

1. In your normal window, sign in as **Alice**, create a document, click
   **Share**, and share it with `bob@docslite.dev` as **Can edit**.
2. Open a **second window (or incognito)**, sign in as **Bob** (`bob@docslite.dev` /
   `docslite-demo`) — the document appears under **Shared with me** and Bob can edit it.

## File upload

Supported types: **`.txt`** and **`.md`** (max 1 MB). Other types are rejected
with a clear message. Markdown is parsed into formatted content; plain text is
kept literal. Use the **Upload .txt / .md** button in the sidebar.

## Testing

```bash
npm test         # unit tests — access control, upload parsing, validation, search text extraction, etc. (no DB)
npm run test:int # integration tests — real Postgres: CRUD, persistence, sharing, workspaces
npm run test:e2e # Playwright — full browser happy path against a real Postgres + running dev server
```

The most important test is `tests/access.test.ts`, which locks the access-control
invariant (owner/editor/viewer/stranger/revoked). Integration tests prove the
full document and sharing lifecycle against a real database.

`test:e2e` needs the Docker DB up, migrated, and seeded (`docker compose up -d
&& npm run db:migrate && npm run db:seed`) — it drives a real Chromium browser
through `npm run dev` and exercises `tests/e2e/happy-path.spec.ts`: sign in as
a seeded user, create a document, type content and confirm autosave, share it
with another seeded user as editor, confirm they can view/edit it, demote them
to viewer and confirm access drops accordingly, then clean up. First run
`npx playwright install chromium` to download the browser binary.

## Project structure

```
src/
  app/                     # routes, pages, server actions, /api/upload
  components/              # editor, document header/share dialog, dashboard upload
  lib/                     # access (pure), session, users, validation, editor, upload
  server/
    services/              # business rules + authorization (the single door)
    repositories/          # Drizzle queries (no auth logic)
    db/                    # schema + client
tests/                     # unit + integration
drizzle/                   # committed SQL migrations
docker-compose.yml         # local Postgres 16
screenshots/               # UI screenshots
```

## Deployment

The app is deployed to **Vercel** against a **Neon** Postgres database — the
live URL is a separate deliverable (see `CLAUDE.md`'s Deliverables map), not
duplicated here. It currently uses the plain `pg` driver against Neon's pooled
connection string (no code changes needed vs. local Docker Postgres — same
schema, same driver, just a different `DATABASE_URL`). Wiring
`@neondatabase/serverless`'s edge-optimized driver as a further optimization
is tracked separately (GitHub issue #53) and isn't required for the app to be
live. **Migrations are run out-of-band** (`npm run db:migrate`, plus the
one-off backfill scripts above when upgrading an existing database) — never
as part of the Vercel build. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and
`tdd.md` §13.B/§5.1.

## Scope

**Built:** documents CRUD + rich-text editor (formatting, links, tables,
images, code blocks, task lists, slash-command menu) + autosave + soft-delete
with trash/restore, version history, `.txt`/`.md` upload, workspaces, sharing
with roles + revoke + a workspace-member picker, full-text search, deployment
to Vercel + Neon, server-side access control, validation & error handling,
unit + integration + e2e tests.

**Deliberately cut** (with reasons in `tdd.md` §2, and see its Amendment Log
for what's since been reconsidered): real-time multiplayer/CRDT (tracked as
GitHub issue #27 — needs an external hosted WebSocket service Vercel
serverless can't provide on its own), inline comments/annotations, `.docx`
import, file archival/storage.

**With more time:** `.docx` import, real-time collaboration (Yjs), comments,
public share links, a command palette, and the rest of the open GitHub issue
backlog.
