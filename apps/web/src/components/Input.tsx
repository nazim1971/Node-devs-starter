'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      className = '',
      type = 'text',
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const actualType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
    const hasRight = showPasswordToggle ?? !!rightIcon;

    const inputClasses = [
      'input',
      error ? 'input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Inline padding to handle icon offsets (avoids needing extra CSS classes)
    const paddingStyle: React.CSSProperties = {
      ...(leftIcon ? { paddingLeft: '2.5rem' } : {}),
      ...(hasRight ? { paddingRight: '2.5rem' } : {}),
    };

    const fieldId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="form-group">
        {label && (
          <label className="label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              style={{ position: 'absolute', left: '0.85rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-subtle)', pointerEvents: 'none' }}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={inputClasses}
            style={paddingStyle}
            aria-invalid={!!error}
            aria-describedby={
              error ? fieldId : hint ? hintId : undefined
            }
            {...props}
          />

          {showPasswordToggle ? (
            <button
              type="button"
              style={{ position: 'absolute', right: '0.85rem', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0' }}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          ) : rightIcon ? (
            <span
              style={{ position: 'absolute', right: '0.85rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-subtle)', pointerEvents: 'none' }}
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          ) : null}
        </div>

        {error && (
          <span id={fieldId} className="field-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={hintId} className="field-hint">
            {hint}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
