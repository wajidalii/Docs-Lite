# Architecture Note — DocsLite

This note explains what was prioritized and why. The full, decision-by-decision
design (with alternatives considered and risks) is in [`tdd.md`](./tdd.md).

## What I prioritized

1. **A correct, testable vertical slice over breadth.** The core loop —
   create → edit/format → save → reopen → share → still-correct-after-refresh —
   works end to end and is covered by tests, rather than many shallow half-features.
2. **Access-control correctness.** For a sharing product, the invariant that
   matters most is "nobody reads or edits a document they aren't entitled to."
   That logic is pure, isolated, and is the primary automated test.
3. **Data fidelity.** Rich-text formatting must survive a round-trip through the
   database. Storing editor JSON in `jsonb` guarantees lossless persistence.

## One app, cleanly layered

A single Next.js App Router application is both the frontend and the backend
(via Server Actions + one route handler for file upload). No separate API
service — fewer moving parts, one deploy target, no CORS. Internally it is
layered so it still reads like a well-structured backend:

```
Client Component (editor, dialogs)
      │  Server Action / Route Handler   ← thin: parse input, resolve user, call service
      ▼
Zod.parse(input)  +  getCurrentUser() from the signed session cookie
      ▼
Service layer  (documentService / sharingService)   ← business rules + AUTHORIZATION
      │   requireDocAccess(docId, userId, minRole)   ← the single security door
      ▼
Repository layer  (documentRepo / shareRepo)         ← Drizzle queries only, no auth
      ▼
Postgres (jsonb document content)
```

**Rules that keep this honest:**
- Actions/handlers are thin; all authorization lives in the service layer.
- The user id always comes from the **signed session cookie**, never from client
  input — so a request can't claim to be someone else.
- Repositories never run without an authorization check having happened first.
- Everything touching the DB/session runs on the Node runtime (never Edge),
  because the `pg` driver is Node-only.

## Access-control model

- **Ownership is implicit** in `documents.owner_id`. There is never an "owner"
  row in the shares table, which removes a whole class of owner/share-sync bugs.
- **Effective role** is computed as: `owner` if you own it, else the role from
  your share row, else `null` → denied.
- Roles rank `viewer < editor < owner`. Each operation declares a minimum:
  read = viewer, save = editor, rename/share/revoke/delete = owner.
- The rank logic is a **pure module** (`src/lib/access.ts`) with no DB or
  framework dependencies, so it can be exhaustively unit-tested. The server DAL
  (`requireDocAccess`) is a thin adapter that loads `{ownerId, shares}` and calls it.
- Denied access returns a generic **not-found** (not 403) so document existence
  isn't leaked.

## Data model

| Table | Purpose |
|---|---|
| `users` | seeded demo users |
| `documents` | `owner_id`, `title`, `content` (`jsonb` = Tiptap JSON), timestamps |
| `document_shares` | `(document_id, shared_with_user_id)` unique, `role` check-constrained to `viewer|editor` |

Indexes back the two dashboard queries ("My Documents" by owner, "Shared with
me" by shared-user) and the permission lookup. Re-sharing is an upsert on the
unique pair, so it changes the role instead of erroring or duplicating.

## Editor & persistence

Tiptap (StarterKit) provides all required formatting with almost no custom code.
Content is serialized to **ProseMirror/Tiptap JSON** and stored in `jsonb`:

- **Lossless** — the exact structure round-trips; formatting never degrades.
- **Safe** — no stored HTML, so no stored-HTML XSS; shared docs render read-only
  via the same editor with `editable: false`, never `dangerouslySetInnerHTML`.
- **Autosave** — debounced with a single in-flight save; the latest change is
  queued and flushed when the current save resolves, so saves can't land out of
  order. The toolbar shows Saving / Saved / Save failed.

Hydration is handled by mounting the editor as a client component with
`immediatelyRender: false`, which avoids SSR/client mismatch.

## File upload

`POST /api/upload` (Node runtime) authenticates, **validates before reading
bytes** (extension allowlist `.txt`/`.md`, size ≤ 1 MB), then parses:
- `.md` → `@tiptap/markdown` `MarkdownManager.parse()` using the *same shared
  extensions* as the editor, so parsed content is guaranteed editor-compatible
  (server-side, no DOM needed).
- `.txt` → literal paragraphs split on blank lines (never markdown-parsed).

Empty/whitespace files still produce a valid, mountable document.

## Testing strategy

- **Unit (no DB):** the access-control matrix (the security invariant), upload
  parsing fidelity, and validation schemas — 21 tests.
- **Integration (real Postgres):** full document lifecycle (create → save →
  reopen lossless → deny stranger) and the sharing lifecycle (share → role
  change → revoke → rejection cases) — 11 tests.
- **Whole-flow:** the production build is verified, and the real browser flow
  (type → format → autosave → reload persistence, and cross-user sharing) was
  exercised end to end (see `screenshots/`).

## Notable tradeoffs

- **Seeded pick-login instead of real auth** — it uses a real encrypted session
  and lets a reviewer switch users trivially to demo sharing, without spending
  the timebox on password/OAuth flows.
- **Last-write-wins, not real-time collaboration** — honest for a
  single-editor-at-a-time demo; CRDT/OT would consume the entire budget.
- **`pg` driver instead of a Neon-specific serverless driver** — one driver
  serves local Docker now and a managed Postgres later, avoiding a rewrite while
  keeping the app deploy-ready.
