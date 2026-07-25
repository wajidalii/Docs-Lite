import { z } from 'zod';

// Validate environment at import time. Throws a clear, named error if the
// config is wrong so failures are obvious instead of surfacing as opaque 500s.
// (Neon-specific pooled/sslmode assertions are added only when wiring the
// deferred deploy target — see tdd.md §13.B.)
const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((v) => /^postgres(ql)?:\/\//.test(v), 'DATABASE_URL must be a postgres:// URL'),
  SESSION_PASSWORD: z
    .string()
    .min(32, 'SESSION_PASSWORD must be at least 32 characters (used to encrypt the session cookie)'),
});

// Accept DATABASE_URL, or the POSTGRES_URL that Vercel Postgres auto-injects into
// a linked project (prefer the pooled one for serverless). Locally, DATABASE_URL wins.
const parsed = EnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
  SESSION_PASSWORD: process.env.SESSION_PASSWORD,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
  throw new Error(`[env] Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env.local and fill the values.`);
}

export const env = parsed.data;
