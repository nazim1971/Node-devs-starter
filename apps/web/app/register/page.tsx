'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { registerSchema } from '@app/shared';
import { useAuth } from '../../src/providers/AuthProvider';
import { useToast } from '../../src/hooks/useToast';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ToastContainer } from '../../src/components/Toast';

type RegisterFields = z.infer<typeof registerSchema>;
type FormErrors = Partial<Record<keyof RegisterFields, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toasts, toast, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please select a valid image file.', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be smaller than 5 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
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
    const res = await register({ name, email, password });
    setIsSubmitting(false);

    if (res.success) {
      router.replace('/profile');
    } else {
      toast(res.message || 'Registration failed. Please try again.', 'danger');
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of developers building with NodeStarter</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Avatar upload */}
          <div className="avatar-upload">
            <div
              className="avatar-upload__preview"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload avatar"
              onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <span className="avatar-upload__placeholder" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>
              )}
              <div className="avatar-upload__overlay" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </div>
            <span className="avatar-upload__hint">Click to upload avatar (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          <Input
            label="Full name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            autoFocus
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            showPasswordToggle
            autoComplete="new-password"
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
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
            Create account
          </Button>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            By creating an account you agree to our{' '}
            <a href="#" className="auth-link">Terms</a> and{' '}
            <a href="#" className="auth-link">Privacy Policy</a>.
          </p>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
