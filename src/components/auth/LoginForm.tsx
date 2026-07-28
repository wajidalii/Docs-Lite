'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { signIn } from '@/app/actions/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form className="dl-auth-form" onSubmit={onSubmit}>
      <div className="dl-auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className={`dl-field${error ? ' is-error' : ''}`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="dl-auth-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className={`dl-field${error ? ' is-error' : ''}`}
          type="password"
          autoComplete="current-password"
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
        {busy ? <span className="dl-spinner" /> : 'Sign in'}
      </button>
    </form>
  );
}
