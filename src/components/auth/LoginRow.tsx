'use client';

import { useFormStatus } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { signInAs } from '@/app/actions/auth';
import { Avatar } from '@/components/brand/Avatar';

function RowButton({ id, name, email }: { id: string; name: string; email: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dl-login-row" disabled={pending} aria-label={`Sign in as ${name}`}>
      <Avatar id={id} name={name} size={36} />
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span className="name">{name}</span>
        <span className="email">{email}</span>
      </span>
      <span className="chev">{pending ? <span className="dl-spinner" /> : <ChevronRight size={17} />}</span>
    </button>
  );
}

export function LoginRow({ id, name, email }: { id: string; name: string; email: string }) {
  return (
    <form action={signInAs.bind(null, id)}>
      <RowButton id={id} name={name} email={email} />
    </form>
  );
}
