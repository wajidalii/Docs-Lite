import { avatarColor, initials } from '@/lib/avatar';

export function Avatar({ id, name, size = 36 }: { id: string; name: string; size?: number }) {
  return (
    <span
      className="dl-avatar"
      style={{ width: size, height: size, background: avatarColor(id), fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
