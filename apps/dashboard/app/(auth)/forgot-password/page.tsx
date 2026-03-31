'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../src/lib/apiClient';
import { ThemeToggle } from '../../src/components/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const res = await apiClient.post('/auth/forgot-password', { email });
    if (res.success) {
      setSent(true);
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__theme-toggle">
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Forgot Password</h1>
          <p className="auth-card__subtitle">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="auth-card__success">
            <div className="alert alert--success" role="status">
              Check your email for the password reset link.
            </div>
            <Link href="/login" className="btn btn--ghost btn--full" style={{ marginTop: '1rem' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert--danger" role="alert">{error}</div>
            )}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="spinner spinner--sm" aria-hidden="true" />
              ) : null}
              Send Reset Link
            </button>
            <div className="auth-form__footer">
              <Link href="/login" className="auth-link">Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
