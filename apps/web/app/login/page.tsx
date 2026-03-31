'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { loginSchema } from '@app/shared';
import { useAuth } from '../../src/providers/AuthProvider';
import { useToast } from '../../src/hooks/useToast';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ToastContainer } from '../../src/components/Toast';

type FormErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toasts, toast, dismiss } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await login({ email, password, rememberMe });
    setIsSubmitting(false);

    if (res.success) {
      router.replace('/profile');
    } else {
      toast(res.message || 'Invalid credentials. Please try again.', 'danger');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo" aria-label="NodeStarter home">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="var(--color-primary)" strokeWidth="2" fill="var(--color-primary-subtle)" />
            <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="var(--color-primary)" opacity="0.35" />
          </svg>
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your NodeStarter account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            showPasswordToggle
            autoComplete="current-password"
          />

          <div className="auth-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="auth-link" style={{ fontSize: 'var(--text-sm)' }}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="full"
            isLoading={isSubmitting}
            className="auth-submit"
          >
            Sign in
          </Button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="auth-link">
            Create one
          </Link>
        </p>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
