# AI Workflow Note — DocsLite

This role is AI-forward, so this app was built end-to-end with AI in the loop.
What follows is an honest account of *how* — the goal was practical, verified AI
usage, not volume.

## Tools used

- **Claude Code (agentic CLI)** as the primary driver — reading/writing files,
  running the toolchain (npm, Docker, Drizzle, Vitest), and executing a
  multi-agent research workflow.
- **A multi-agent research workflow** — for the design phase, ~20 agents ran in
  parallel: one researcher per technical decision, an adversarial "red-team"
  reviewer per recommendation, and failure-mode analysts, synthesized into the
  locked design doc (`tdd.md`).
- **Live web search + library-docs lookup** — to verify current library
  versions and APIs instead of trusting the model's training data.
- **Playwright driving the local Chrome** — to verify the real browser flow and
  capture the screenshots (removed from dependencies afterward).

## Where AI materially sped up the work

- **Design & decision-making.** The research→red-team→risk workflow produced a
  ranked, pros/cons comparison for every choice (editor library, ORM, auth,
  upload parsing, access-control model, testing) in minutes instead of hours,
  and surfaced integration risks up front.
- **Boilerplate & wiring.** Scaffolding, the Drizzle schema, the layered
  service/repository code, Zod schemas, and the entire CSS theme were generated
  quickly, then reviewed.
- **Tests.** The unit and integration tests were written test-first with AI,
  which made "prove it works" cheap enough to do continuously.

## What AI output I changed or rejected

Verifying AI claims against reality caught several things before they became bugs:

1. **Rejected a hallucination risk on Tiptap.** An initial recommendation
   assumed a separate underline extension. Checking the live Tiptap v3 docs
   showed underline ships in StarterKit — so that extension was *removed*, not
   added.
2. **Rejected the assumed markdown parser shape.** I verified `@tiptap/markdown`
   actually exposes a server-side `MarkdownManager.parse()` (no DOM) *and* ran a
   throwaway probe to confirm it parses headings/lists/bold with StarterKit
   before building the upload feature on it.
3. **Overrode the database driver for local-first.** The original design used a
   Neon-only serverless HTTP driver. Since the requirement was to run locally in
   Docker, I switched to the standard `pg` driver — which works for both local
   Postgres now and a managed Postgres later, avoiding a rewrite.
4. **Adopted red-team corrections** into the design: run migrations out-of-band
   (never in the build), keep DB/session on the Node runtime (never Edge), and
   treat every server action as a public endpoint that must re-authorize.
5. **Fixed generated code during review** — e.g. an incorrect async handler in
   the share dialog and React type-import details were corrected before they
   reached a green build.

## How I verified correctness, UX, and reliability

Nothing was trusted because "the AI wrote it." Each layer was verified:

- **Access-control correctness** — 9 pure unit tests locking the
  owner/editor/viewer/stranger/revoked matrix (the core security invariant).
- **Data & behavior** — 11 integration tests against a **real Postgres**:
  document create/save/reopen (asserting lossless `jsonb` round-trip), stranger
  denial, and the full sharing lifecycle (share → role change → revoke →
  rejection cases).
- **Parsing & validation** — unit tests for markdown-vs-literal upload parsing
  and the Zod schemas.
- **Build integrity** — a clean production `next build` (catches client/server
  boundary and `server-only` leaks that types alone miss).
- **Real browser flow** — a Playwright run against Chrome that signed in, typed
  and formatted text, waited for autosave, reloaded to confirm persistence, and
  shared a document across two user sessions. Screenshots are in `screenshots/`.
- **UX** — I reviewed the rendered screenshots and iterated on the theme rather
  than assuming the CSS looked right.

**Test tally: 21 unit + 11 integration, all green; production build clean;
end-to-end browser flow verified.**

## Where a human stayed in the loop

Scope decisions, the local-first + Docker constraint, the stack (Next.js one-app
+ NestJS-considered-and-cut), the "complete functionality before styling"
sequencing, and sign-off on the locked design were all human calls. AI did the
research, drafting, and verification; the judgment about *what to build and in
what order* was directed, not outsourced.
