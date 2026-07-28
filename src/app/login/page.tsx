import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { LoginForm } from '@/components/auth/LoginForm';
import { SEED_USERS, SEED_USER_PASSWORD } from '@/lib/users';

export default function LoginPage() {
  return (
    <div className="dl-login-scroll">
      <div className="dl-login-inner">
        <div className="dl-login-lockup">
          <Logo size={26} />
          <span className="dl-login-word">DocsLite</span>
        </div>
        <h1 className="dl-login-h1">Sign in</h1>
        <p className="dl-login-sub">Welcome back. Enter your email and password to continue.</p>
        <div className="dl-login-card">
          <LoginForm />
        </div>
        <p className="dl-auth-switch">
          No account? <Link href="/signup">Create one</Link>
        </p>
        <p className="dl-auth-demo">
          Demo accounts (password <code>{SEED_USER_PASSWORD}</code>): {SEED_USERS.map((u) => u.email).join(', ')}
        </p>
      </div>
    </div>
  );
}
