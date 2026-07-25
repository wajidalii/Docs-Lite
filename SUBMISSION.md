# Submission — DocsLite

A lightweight collaborative document editor for the Ajaia "AI-Native Full Stack
Developer" take-home.

## What's included

| Item | Location |
|---|---|
| Source code (Next.js 16 app) | `src/`, `docker-compose.yml`, config files |
| Setup & run instructions | [`README.md`](./README.md) |
| Architecture note | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| AI workflow note | [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) |
| Full technical design doc | [`tdd.md`](./tdd.md) |
| Database migrations (committed) | `drizzle/` |
| Automated tests | `tests/` (unit + integration) |
| UI screenshots (desktop + mobile) | `screenshots/v2-*.png` |
| Design system handoff | `design/` |
| This file | `SUBMISSION.md` |
| Walkthrough video link | see **Walkthrough video** below |

## How to run

See [`README.md`](./README.md). Short version:

```bash
docker compose up -d
npm install
cp .env.example .env.local
npm run db:migrate && npm run db:seed
npm run dev            # http://localhost:3000
```

## Test accounts (seeded, no password)

| Name | Email |
|---|---|
| Alice Kim | `alice@docslite.dev` |
| Bob Rivera | `bob@docslite.dev` |
| Carol Nasser | `carol@docslite.dev` |
| Dave Okoro | `dave@docslite.dev` |

To demo sharing, sign in as Alice, share a doc with `bob@docslite.dev`, then open
a second/incognito window as Bob (details in the README).

## What is working (verified)

- ✅ Create / rename / edit / autosave / reopen / delete documents
- ✅ Rich text: bold, italic, underline, H1/H2/H3, bulleted & numbered lists
- ✅ Upload `.txt`/`.md` → new editable document (markdown parsed; text literal)
- ✅ Sharing: grant viewer/editor access by email, change role, revoke
- ✅ "My Documents" vs "Shared with me" split
- ✅ Persistence across refresh with formatting preserved (lossless `jsonb`)
- ✅ Server-side access control on every read/write (no IDOR)
- ✅ Validation + error handling (fail-fast env, Zod, error toasts)
- ✅ Polished, responsive v2 UI (custom design system, mobile drawer, brand
  assets: favicon + Open Graph image)
- ✅ Tests: **21 unit + 11 integration, all green**; clean production build;
  real-browser end-to-end flow verified (desktop + mobile)

## What is incomplete / deliberately cut

These were scoped out on purpose to keep depth over breadth (rationale in
`tdd.md` §2):

- Deployment (app is deploy-ready but runs locally for this submission)
- `.docx` upload (only `.txt`/`.md` supported)
- Real authentication (uses a seeded demo login with a real session)
- Real-time multi-user collaboration / presence
- Comments, suggestions, version history

## What I'd build next (another 2–4 hours)

1. Deploy to Vercel + Neon (config-only; the app is already env-driven).
2. `.docx` import via `mammoth` → sanitized HTML → editor JSON.
3. Real authentication (email/password or OAuth) replacing the demo login.
4. Share-by-link and a document-level activity/updated-by indicator.

## Walkthrough video

> **To be added:** paste the unlisted Loom/YouTube link here (and in the
> separate video link file). Suggested 3–5 min flow: sign in → create & format a
> doc → show autosave + reload persistence → upload a `.md` file → share with Bob
> and switch users → brief note on the AI workflow and how correctness was verified.
