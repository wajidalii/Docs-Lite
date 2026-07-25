// Deterministic avatar fills — sum the char codes of the user id, mod 6.
const FILLS = ['#4f4fc9', '#0f766e', '#b45309', '#9333a8', '#1d4ed8', '#166534'];

export function avatarColor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return FILLS[sum % FILLS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}
