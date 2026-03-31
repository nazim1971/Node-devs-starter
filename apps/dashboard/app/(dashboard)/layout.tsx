'use client';

import React from 'react';
import { Sidebar } from '../../src/components/Sidebar';
import { Topbar } from '../../src/components/Topbar';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="dash-layout">
        <Sidebar />
        <div className="dash-layout__main">
          <Topbar />
          <main className="dash-layout__content">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
