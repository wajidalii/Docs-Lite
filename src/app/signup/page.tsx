import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="dl-login-scroll">
      <div className="dl-login-inner">
        <div className="dl-login-lockup">
          <Logo size={26} />
          <span className="dl-login-word">DocsLite</span>
        </div>
        <h1 className="dl-login-h1">Create your account</h1>
        <p className="dl-login-sub">Set a password of at least 8 characters.</p>
        <div className="dl-login-card">
          <SignupForm />
        </div>
        <p className="dl-auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
