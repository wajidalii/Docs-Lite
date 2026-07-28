# DocsLite — a lightweight collaborative document editor

A Google-Docs-lite app: create, edit, and format rich-text documents, upload
`.txt`/`.md` files into new documents, and share documents with other users
(viewer/editor roles). Built as a single **Next.js 16** app (frontend + backend
via Server Actions and route handlers) on **Postgres**, run locally with Docker.

> Built for the Ajaia "AI-Native Full Stack Developer" take-home. See
> [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) for how AI was used, [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> for design decisions, and [`tdd.md`](./tdd.md) for the full technical design.

## Features

- **Documents** — create, rename (inline), edit, autosave, reopen, delete.
- **Rich text** — bold, italic, underline, H1/H2/H3 + paragraph, bulleted &
  numbered lists (Tiptap). Content is stored as JSON and round-trips losslessly.
- **File upload** — upload a `.txt` or `.md` file to create a new editable
  document. Markdown formatting is parsed; plain text stays literal.
- **Sharing** — a document owner grants another user access as **viewer** or
  **editor**, can change roles, and can revoke. The dashboard splits
  **My Documents** vs **Shared with me**.
- **Access control** — every read/write is authorized server-side through a
  single door; a user can never touch a document they don't own or aren't
  shared on (no IDOR).

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) — one app, FE + BE |
| Database | Postgres (local via Docker; `pg` driver, deploy-ready for Neon) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Editor | Tiptap v3 (StarterKit) — content stored as JSON in `jsonb` |
| Auth | iron-session (encrypted cookie) + email/password (Node `crypto.scrypt`) |
| Upload parsing | `@tiptap/markdown` (server-side, no DOM) |
| Validation | Zod (shared client + server) |
| Styling | Tailwind CSS v4 (`@theme` tokens) + custom design system; Instrument Sans / Source Serif 4 / Instrument Serif via `next/font`; `sonner` toasts |
| Tests | Vitest (unit) + Vitest integration against real Postgres |

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
| `npm run db:migrate` | Apply committed SQL migrations |
| `npm run db:seed` | Insert the 4 seeded users |
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
npm test         # 21 unit tests — access control, upload parsing, validation
npm run test:int # 11 integration tests — real Postgres: CRUD, persistence, sharing
```

The most important test is `tests/access.test.ts`, which locks the access-control
invariant (owner/editor/viewer/stranger/revoked). Integration tests prove the
full document and sharing lifecycle against a real database.

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

Deployment is intentionally **deferred** for this submission — the app runs
locally against Dockerized Postgres. It is **deploy-ready**: all config is
env-driven and the `pg` driver also connects to a managed Postgres (e.g. Neon),
so shipping to Vercel later is a configuration step, not a rewrite. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) and `tdd.md` §13.B.

## Scope

**Built:** documents CRUD + rich-text editor + autosave, `.txt`/`.md` upload,
sharing with roles + revoke, persistence, server-side access control, validation
& error handling, automated tests.

**Deliberately cut** (with reasons in `tdd.md` §2): real-time multiplayer/CRDT,
production auth (passwords/OAuth), `.docx` import, file archival/storage,
comments, version history, deployment.

**With more time:** `.docx` import, real auth, real-time collaboration (Yjs),
comments & version history, deployment to Vercel + Neon.
