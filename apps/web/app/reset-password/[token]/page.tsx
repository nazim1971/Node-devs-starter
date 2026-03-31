'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { z } from 'zod';
import { resetPasswordSchema } from '@app/shared';
import { apiClient } from '../../../src/lib/apiClient';
import { useToast } from '../../../src/hooks/useToast';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { ToastContainer } from '../../../src/components/Toast';

type ResetFields = z.infer<typeof resetPasswordSchema>;
type FormErrors = Partial<Record<'token' | 'newPassword' | 'confirmPassword', string>>;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ token, newPassword: password, confirmPassword });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await apiClient.post('/auth/reset-password', { token, password });
    setIsSubmitting(false);

    if (res.success) {
      setDone(true);
      setTimeout(() => router.replace('/login'), 3000);
    } else {
      toast(res.message || 'Reset link is invalid or expired.', 'danger');
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

        {done ? (
          <div className="auth-success">
            <div className="auth-success__icon" aria-hidden="true">✅</div>
            <h2 className="auth-success__title">Password reset!</h2>
            <p className="auth-success__text">
              Your password has been updated. Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Choose a strong password for your account.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.newPassword}
                showPasswordToggle
                autoComplete="new-password"
                autoFocus
              />

              <Input
                label="Confirm new password"
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                showPasswordToggle
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="full"
                isLoading={isSubmitting}
                className="auth-submit"
              >
                Reset password
              </Button>
            </form>

            <p className="auth-footer-text">
              <Link href="/login" className="auth-link">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
