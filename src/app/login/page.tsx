import { Logo } from '@/components/brand/Logo';
import { SEED_USERS } from '@/lib/users';
import { LoginRow } from '@/components/auth/LoginRow';

export default function LoginPage() {
  return (
    <div className="dl-login-scroll">
      <div className="dl-login-inner">
        <div className="dl-login-lockup">
          <Logo size={26} />
          <span className="dl-login-word">DocsLite</span>
        </div>
        <h1 className="dl-login-h1">Pick an account to continue</h1>
        <p className="dl-login-sub">
          A demo sign-in — no password. Choose a teammate to see the workspace from their side.
        </p>
        <div className="dl-login-card">
          {SEED_USERS.map((u) => (
            <LoginRow key={u.id} id={u.id} name={u.name} email={u.email} />
          ))}
        </div>
        <p className="dl-login-foot">Demo workspace · sessions are not persisted</p>
      </div>
    </div>
  );
}
