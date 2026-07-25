// Seeded demo users. Fixed UUIDs so the values here always match the rows
// inserted by scripts/seed.ts (FKs resolve). This is an intentional demo login,
// not production auth — see README.

export type SeededUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export const SEED_USERS: SeededUser[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Alice Kim', email: 'alice@docslite.dev', initials: 'AK' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Bob Rivera', email: 'bob@docslite.dev', initials: 'BR' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Carol Nasser', email: 'carol@docslite.dev', initials: 'CN' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Dave Okoro', email: 'dave@docslite.dev', initials: 'DO' },
];

const byId = new Map(SEED_USERS.map((u) => [u.id, u]));
const byEmail = new Map(SEED_USERS.map((u) => [u.email.toLowerCase(), u]));

export function getSeededUser(id: string): SeededUser | undefined {
  return byId.get(id);
}

export function getSeededUserByEmail(email: string): SeededUser | undefined {
  return byEmail.get(email.trim().toLowerCase());
}

export function isSeededUserId(id: string): boolean {
  return byId.has(id);
}
