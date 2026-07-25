# Deploying DocsLite (Vercel + Neon)

## GitHub → Vercel checklist (current project state)

**Already done from the dev machine (nothing to repeat):**
- [x] Neon database created and **migrated + seeded** (4 demo users). No migration
      runs during deploy.
- [x] App is deploy-ready: clean production build; `env.ts` accepts either
      `DATABASE_URL` or the `POSTGRES_URL` that Vercel Postgres auto-injects.
- [x] Secrets safe: `.env.local` is git-ignored; no DB credentials live in the repo.

**When the code is on GitHub** — the repo should include `drizzle/` (migrations),
`.env.example`, `design/`, `screenshots/`, and exclude `node_modules`, `.next`,
`.env.local` (the `.gitignore` already enforces this).

**In Vercel (New Project → import the GitHub repo):**
- [ ] Framework preset **Next.js** (auto); Build Command = default `next build`;
      root = repo root. **Do not add a migrate step to the build.**
- [ ] **Link the Postgres store to this project** (Storage tab) so Vercel injects
      `POSTGRES_URL` automatically — the app will use it. *(Alternative: add
      `DATABASE_URL` = your Neon connection string manually.)*
- [ ] Add env var **`SESSION_PASSWORD`** (≥32 chars) for **Production** (and
      Preview if used). **Set it before the first deploy** — env is validated at build.
- [ ] Deploy.

**Verify on the live URL:** sign in as Alice → create + format a doc → "Saved" →
Share with `bob@docslite.dev` → open incognito as Bob → doc appears under "Shared
with me" → hard refresh persists.

**Env vars:**

| Var | Needed? | Value |
|---|---|---|
| `SESSION_PASSWORD` | Always | a ≥32-char secret (`openssl rand -base64 32`) |
| `POSTGRES_URL` | Auto-injected when the Postgres store is linked to the project | (Vercel sets it) |
| `DATABASE_URL` | Only if the store is **not** linked | your Neon connection string (pooled `-pooler` preferred) |

---

## Full reference


The app is deploy-ready: all config is env-driven and the `pg` driver connects to
Neon's Postgres, so no code changes are needed. Target: **Next.js app on Vercel**,
**Postgres on Neon** — both free.

**Golden rules (from `tdd.md` §13.B):**
- Run database **migrations out-of-band** (from your machine) — **never** in the
  Vercel build.
- Keep the Build Command as the default **`next build`**.
- Everything touching the DB/session runs on the **Node runtime** (already true).
- Set env vars **before** the first deploy (the app validates env at build time).

---

## 0. Prerequisites (free accounts)

- **GitHub** account (host the code)
- **Vercel** account (https://vercel.com) — sign in with GitHub
- **Neon** account (https://neon.tech) — sign in with GitHub

---

## 1. Push the code to GitHub

If this repo isn't in git yet:

```bash
git init
git add -A
git commit -m "DocsLite: collaborative document editor"
```

Create an empty repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/<you>/docslite.git
git branch -M main
git push -u origin main
```

`.env.local` is git-ignored (secrets never get committed); `.env.example` is
committed.

---

## 2. Create the Neon database

1. In the Neon console: **New Project** (pick a region near you).
2. Open **Connect** / **Connection Details**. Neon gives you connection strings.
   You need **two**:
   - **Pooled** — host contains **`-pooler`** (e.g. `ep-xxx-pooler.<region>.aws.neon.tech`).
     Use this for the app on Vercel (safe under serverless concurrency).
   - **Direct** — host **without** `-pooler`. Use this for running migrations.
   Both should end with **`?sslmode=require`** (Neon includes it; add it if not).

Keep both strings handy.

---

## 3. Create the schema + seed users (out-of-band, from your machine)

Run the committed migrations and the seed against Neon. Use the **direct**
(non-pooled) string for this. The inline `DATABASE_URL` wins over `.env.local`.

```bash
# apply schema
DATABASE_URL='postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/DB?sslmode=require' npm run db:migrate

# seed the 4 demo users (REQUIRED — creating docs needs these user rows to exist)
DATABASE_URL='postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/DB?sslmode=require' npm run db:seed
```

> Seeding is not optional: sign-in picks a seeded user, and creating a document
> references that user row (foreign key). Without seeding, document creation fails.

Sanity check (optional): in the Neon console SQL editor, run
`select name, email from users;` — you should see Alice, Bob, Carol, Dave.

---

## 4. Generate a session secret

```bash
openssl rand -base64 32
```
Copy the output — that's your `SESSION_PASSWORD` (≥32 chars).

---

## 5. Import the project into Vercel

1. Vercel → **Add New… → Project** → import your GitHub repo.
2. **Framework Preset:** Next.js (auto-detected). **Build Command:** leave default
   (`next build`). **Root Directory:** the repo root.
3. **Environment Variables** — add these for **Production** (and Preview if you'll
   use preview deploys):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon **pooled** string (`-pooler` host, `?sslmode=require`) |
   | `SESSION_PASSWORD` | the 32+ char secret from step 4 |

4. Click **Deploy**.

---

## 6. Verify the live app

Open the Vercel Production URL and check the demo flow:
1. You land on `/login` → pick **Alice**.
2. Create a document, type + format (H1, bold, list) → status shows **Saved**.
3. **Share** with `bob@docslite.dev` (Can edit).
4. Open an incognito window → sign in as **Bob** → the doc is under **Shared with me**.
5. Hard-refresh → content + share persist.

The first request after idle may be slightly slow (Neon free tier auto-suspends);
that's expected.

---

## 7. First-deploy gotchas checklist

- [ ] `DATABASE_URL` (pooled) + `SESSION_PASSWORD` set in Vercel **before** deploy.
- [ ] Migrations + seed run against Neon **out-of-band** (steps 3), not in the build.
- [ ] Build Command is the default `next build` (no migrate step).
- [ ] Connection string includes `?sslmode=require`.
- [ ] Seeded users exist in Neon (`select * from users;`).
- [ ] Nothing uses `runtime = 'edge'` (already true; upload route is `nodejs`).

---

## Optional hardening (nice-to-have)

- **Tighten the env guard** (`src/lib/env.ts`) to assert the production string is
  pooled + SSL (e.g. require `-pooler` and `sslmode=require` when `NODE_ENV=production`).
- **Custom domain** in Vercel → Settings → Domains.
- **Preview deploys:** if you enable them, give Preview its own env vars (a Neon
  branch is ideal) and migrate that branch too.
- **Add favicon + Open Graph** once the design handoff lands (wire into
  `src/app/layout.tsx` / `opengraph-image`).

---

## Troubleshooting

- **Build fails with an env error** → env vars weren't set (or not for the build).
  Set them in Vercel and redeploy.
- **App loads but every request 500s** → `DATABASE_URL` wrong/unreachable, or
  schema not migrated. Re-check step 3 and the pooled string.
- **Creating a doc errors (foreign key)** → users not seeded on Neon; run step 3's
  seed command.
- **SSL / self-signed error from `pg`** → ensure `?sslmode=require` is in the
  string. If it persists, set `ssl: { rejectUnauthorized: false }` in the `Pool`
  options in `src/server/db/client.ts`.
- **Sessions don't stick / login loops** → `SESSION_PASSWORD` missing or <32 chars.
