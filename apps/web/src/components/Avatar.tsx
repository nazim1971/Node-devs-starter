'use client';

import { useState, type MouseEventHandler } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  clickable?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  alt?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  clickable = false,
  onClick,
  className = '',
  alt,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = `avatar--${size}`;
  const classes = ['avatar', sizeClass, clickable ? 'avatar--clickable' : '', className]
    .filter(Boolean)
    .join(' ');

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? name ?? 'Avatar'}
        className={classes}
        onError={() => setImgError(true)}
        onClick={onClick}
      />
    );
  }

  const initials = getInitials(name);
  return (
    <span
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={alt ?? name ?? 'Avatar'}
    >
      {initials || '?'}
    </span>
  );
}
