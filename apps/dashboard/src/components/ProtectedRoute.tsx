'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="protected-route__loading">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') return null;

  return <>{children}</>;
}
