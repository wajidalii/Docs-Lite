# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ajaia Take-Home — DocsLite Collaborative Doc Editor

This repo is a **single** timed take-home for **Ajaia LLC — "AI-Native Full Stack
Developer"**. There is one assignment: build a lightweight collaborative document
editor (Google-Docs-lite), deployed live. Everything in this repo serves that one
build. The role is an AI-orchestration role — using AI end-to-end is expected and
graded, not cheating. Goal: a fully working, verified, deployed slice with clean
docs.

## Source of truth

- **`tdd.md`** — the LOCKED Technical Design Document (14 sections): scope,
  stack, data model, API surface, feature acceptance criteria, UI/color spec,
  test-first plan, risk register, hour-by-hour build plan, deploy runbook,
  deliverables map. Implement strictly against it. Do not re-litigate locked
  decisions; if something must change, update `tdd.md` first, then build.
- `.research-decisions.md` / `.research-risks.md` — raw research backing the TDD
  (reference only).

## Locked stack (see tdd.md §3 for full table + versions)

Single **Next.js 16 App Router (TS)** app — frontend + backend via Server Actions
+ route handlers — on **Vercel free**. **Drizzle ORM** + `@neondatabase/serverless`
→ **Neon** Postgres. Editor **Tiptap v3** (StarterKit already includes Underline).
Content stored as **jsonb** (Tiptap JSON). Auth = **iron-session** session
cookie + real email/password (Node `crypto.scrypt` hashing) — see tdd.md's
Amendment Log (2026-07-28); originally a seeded pick-login with no
credentials, now real signup/login while keeping the 4 seeded demo users
(with a documented password) for the sharing demo. Upload `.txt`/`.md` via
**`@tiptap/markdown`**. Validation **Zod**.
Styling Tailwind v4 + shadcn/ui. Tests **Vitest** (⭐ meaningful test =
access-control logic).

## Non-negotiables (from the risk analysis — violating these breaks the app)

- Migrations run **out-of-band**, never in the Vercel build.
- **Node runtime** everywhere DB/session is touched (never edge).
- One `requireDocAccess` door on every doc read/write; identity read **only** from
  the signed cookie (never a client-supplied userId) → no IDOR.
- Editor: `immediatelyRender:false` + a single shared Tiptap extensions array.
- Env guard throws a named error if `DATABASE_URL` / `SESSION_PASSWORD` are missing.

## Commands

```bash
docker compose up -d      # start local Postgres (required for db:* and test:int)
npm run dev                # dev server
npm run build               # production build
npm run lint                # eslint

npm test                    # unit tests (tests/*.test.ts) — no DB needed
npm run test:watch          # unit tests, watch mode
npx vitest run tests/access.test.ts        # run a single unit test file
npx vitest run -t "pattern"                # filter by test name

npm run test:int            # integration tests (tests/integration/**) — needs Docker DB up

npm run db:generate         # generate a new SQL migration from schema.ts
npm run db:migrate          # apply committed migrations (out-of-band; never in the build)
npm run db:seed             # insert the 4 seeded demo users
npm run db:reset            # drop & recreate the Docker DB volume (re-run migrate + seed after)
```

Unit tests stub `server-only` (see `tests/stubs/server-only.ts`, aliased in
`vitest.config.ts`) so service/lib code can be imported without a request
context. Integration tests run with `fileParallelism: false` against the real
Dockerized Postgres and need `docker compose up -d` first.

## Architecture

One Next.js App Router app is both frontend and backend (Server Actions + a
single `/api/upload` route handler — no separate API service). Every
request-handling path funnels through the same layering, and violating the
order is the main way to reintroduce an IDOR:

```
Client Component
   → Server Action / route handler   (thin: Zod.parse(input) + getCurrentUser() from the session cookie)
      → Service layer                (documentService / sharingService — business rules + requireDocAccess)
         → Repository layer          (documentRepo / shareRepo — Drizzle queries only, no auth logic)
            → Postgres
```

- **Access control** is split into two layers on purpose:
  `src/lib/access.ts` is a pure, DB-free rank model (`viewer(1) < editor(2) <
  owner(3)`) computing a user's `effectiveRole` from `{ownerId, shares}` — this
  is the unit-tested security invariant. `src/server/services/access-control.ts`'s
  `requireDocAccess(docId, userId, min)` is the thin adapter every service
  function calls before touching a repo; it throws a generic `NotFoundError`
  on denial (never a 403) so document existence is never leaked. Ownership is
  implicit in `documents.owner_id` — there is never an owner row in
  `document_shares`.
- **Editor content fidelity**: `src/lib/editor/extensions.ts` exports the
  single shared Tiptap extensions array. It's used both by the client editor
  (`src/components/editor/Editor.tsx`) and by the server-side markdown parser
  (`src/lib/upload/parse.ts`, via `@tiptap/markdown`) so uploaded and
  hand-typed content are schema-compatible and round-trip losslessly through
  the `jsonb` `documents.content` column. Never declare a second extensions
  array — content parsed with a different schema will silently lose marks.
- **Upload flow**: `POST /api/upload` (`runtime = 'nodejs'`) authenticates,
  validates extension/size (`src/lib/upload/validate.ts`) *before* reading any
  bytes, then parses — `.md` through the shared Tiptap extensions, `.txt` as
  literal paragraphs split on blank lines (never markdown-parsed) — and calls
  `documentService.createDocumentWithContent`.
- **Env guard** (`src/lib/env.ts`) Zod-validates `DATABASE_URL` /
  `SESSION_PASSWORD` at import time and throws a named error, so misconfig
  fails fast instead of surfacing as an opaque 500.
- **Local vs. locked deploy target**: the app currently runs against the
  Dockerized Postgres via the plain `pg` driver (deployment is deferred — see
  README "Deployment" and `tdd.md` §13.B). Wiring `@neondatabase/serverless` /
  Neon-specific pooling happens only when the deploy step is actually built;
  don't assume it's already present.

## How we work

- **AI-orchestration first.** Scale effort per task: full Workflow swarm for
  hard/multi-part work, lighter fan-out for medium, solo+verify for trivial.
  Always at least one adversarial verification pass. Never hand in unverified
  output.
- Build **test-first**, in the order of tdd.md §12; deploy the vertical slice
  early (target: live on Vercel by ~hour 3), polish last.
- State assumptions explicitly; be honest about status (if a test fails or a step
  is skipped, say so).

## Git / GitHub workflow

For every bug fix or feature (not doc/config-only tweaks):

1. Create a GitHub issue for it (`gh issue create`) before starting work.
2. Create a branch for that issue off `master` (e.g. `issue-<n>-short-slug`).
3. Commit the change(s) on that branch, referencing the issue (e.g. `Closes #<n>`).
4. Open a pull request for the branch (`gh pr create`).
5. Merge the pull request into `master` (`gh pr merge`).
6. Push with `git push` only — never `git push origin master` — after checking out `master` locally and syncing it to the merged result.

## Deliverables (Ajaia requires; see tdd.md §14 for the full map)

Source code · README (setup/run/deploy) · architecture note · AI-workflow note ·
SUBMISSION.md · live product URL · walkthrough video link · seeded/test-user creds
for the sharing demo. Final submission goes into one Google Drive folder.
