// Seeded demo users — fixed UUIDs so the values here always match the rows
// inserted by scripts/seed.ts (FKs resolve). Real auth (email/password) is now
// DB-backed (see src/server/repositories/userRepo.ts); this constant is demo
// metadata only, used by the seed script and to show the sharing-demo hint in
// the login/signup UI. Password for all 4 demo accounts: see README.

export type SeededUserMeta = {
  id: string;
  name: string;
  email: string;
};

export const SEED_USERS: SeededUserMeta[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Alice Kim', email: 'alice@docslite.dev' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Bob Rivera', email: 'bob@docslite.dev' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Carol Nasser', email: 'carol@docslite.dev' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Dave Okoro', email: 'dave@docslite.dev' },
];

export const SEED_USER_PASSWORD = 'docslite-demo';
