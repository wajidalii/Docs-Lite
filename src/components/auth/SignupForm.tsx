'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { signUp } from '@/app/actions/auth';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signUp(email, password, name);
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form className="dl-auth-form" onSubmit={onSubmit}>
      <div className="dl-auth-field">
        <label htmlFor="signup-name">Name</label>
        <input
          id="signup-name"
          className={`dl-field${error ? ' is-error' : ''}`}
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="dl-auth-field">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          className={`dl-field${error ? ' is-error' : ''}`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="dl-auth-field">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className={`dl-field${error ? ' is-error' : ''}`}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="dl-share-msg is-error" role="alert">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      <button type="submit" className="dl-btn-primary" disabled={busy}>
        {busy ? <span className="dl-spinner" /> : 'Create account'}
      </button>
    </form>
  );
}
