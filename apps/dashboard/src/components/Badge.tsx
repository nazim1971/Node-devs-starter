'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`}>
      {children}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    admin: 'danger',
    editor: 'warning',
    user: 'primary',
  };

  return (
    <Badge variant={variantMap[role] ?? 'default'} className={className}>
      {role}
    </Badge>
  );
}

interface StatusBadgeProps {
  isActive: boolean;
  isBanned: boolean;
  className?: string;
}

export function StatusBadge({ isActive, isBanned, className = '' }: StatusBadgeProps) {
  if (isBanned) return <Badge variant="danger" className={className}>Banned</Badge>;
  if (isActive) return <Badge variant="success" className={className}>Active</Badge>;
  return <Badge variant="default" className={className}>Inactive</Badge>;
}
