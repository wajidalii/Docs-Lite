# Ajaia Take-Home — DocsLite Collaborative Doc Editor

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
Content stored as **jsonb** (Tiptap JSON). Auth = **iron-session** seeded
pick-login. Upload `.txt`/`.md` via **`@tiptap/markdown`**. Validation **Zod**.
Styling Tailwind v4 + shadcn/ui. Tests **Vitest** (⭐ meaningful test =
access-control logic).

## Non-negotiables (from the risk analysis — violating these breaks the app)

- Migrations run **out-of-band**, never in the Vercel build.
- **Node runtime** everywhere DB/session is touched (never edge).
- One `requireDocAccess` door on every doc read/write; identity read **only** from
  the signed cookie (never a client-supplied userId) → no IDOR.
- Editor: `immediatelyRender:false` + a single shared Tiptap extensions array.
- Env guard throws a named error if `DATABASE_URL` / `SESSION_PASSWORD` are missing.

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
