'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'lg' | 'full';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'btn',
      `btn--${variant}`,
      size ? `btn--${size}` : '',
      isLoading ? 'btn--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {leftIcon && !isLoading && (
          <span style={{ display: 'inline-flex', marginRight: '0.4em' }} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && !isLoading && (
          <span style={{ display: 'inline-flex', marginLeft: '0.4em' }} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
