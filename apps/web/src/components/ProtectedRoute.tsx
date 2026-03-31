'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, user must have one of these roles */
  roles?: string[];
  /** Where to redirect unauthorised users (default: '/login') */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  roles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, roles, user, router, redirectTo]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (roles && roles.length > 0 && user && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
