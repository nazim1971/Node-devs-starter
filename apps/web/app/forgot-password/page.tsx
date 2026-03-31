'use client';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { forgotPasswordSchema } from '@app/shared';
import { apiClient } from '../../src/lib/apiClient';
import { useToast } from '../../src/hooks/useToast';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ToastContainer } from '../../src/components/Toast';

type FormErrors = Partial<Record<'email', string>>;

export default function ForgotPasswordPage() {
  const { toasts, toast, dismiss } = useToast();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.issues[0]?.message });
      return;
    }

    setIsSubmitting(true);
    const res = await apiClient.post('/auth/forgot-password', { email });
    setIsSubmitting(false);

    if (res.success) {
      setSent(true);
    } else {
      toast(res.message || 'Something went wrong. Please try again.', 'danger');
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

        {sent ? (
          <div className="auth-success">
            <div className="auth-success__icon" aria-hidden="true">📬</div>
            <h2 className="auth-success__title">Check your email</h2>
            <p className="auth-success__text">
              We sent a password reset link to <strong>{email}</strong>.
              It expires in 1 hour.
            </p>
            <Link href="/login" className="btn btn--primary" style={{ display: 'inline-block', marginTop: 'var(--space-6)' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle">
                Enter your email and we&apos;ll send you a reset link.
              </p>
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

              <Button
                type="submit"
                variant="primary"
                size="full"
                isLoading={isSubmitting}
                className="auth-submit"
              >
                Send reset link
              </Button>
            </form>

            <p className="auth-footer-text">
              Remember your password?{' '}
              <Link href="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
