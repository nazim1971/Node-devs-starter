'use client';

import React from 'react';
import { StatCard } from '../../src/components/StatCard';
import { LineChart } from '../../src/components/LineChart';
import { DataTable, type ColumnDef } from '../../src/components/DataTable';
import { RoleBadge } from '../../src/components/Badge';
import { useDashboardStats, type RecentSignup } from '../../src/hooks/useDashboardStats';
import { formatDate } from '@app/shared';
import Link from 'next/link';

const recentColumns: ColumnDef<RecentSignup>[] = [
  {
    key: 'name',
    header: 'User',
    render: (user) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="user-avatar-cell">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="user-avatar-cell__img" />
          ) : (
            <span className="user-avatar-cell__initials">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 500 }}>{user.name}</div>
          <div className="text-muted text-sm">{user.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (user) => <RoleBadge role={user.role} />,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    render: (user) => (
      <span className="text-muted">{formatDate(user.createdAt)}</span>
    ),
  },
  {
    key: 'id',
    header: '',
    align: 'right' as const,
    render: (user) => (
      <Link href={`/users/${user.id}`} className="btn btn--ghost btn--sm">
        View
      </Link>
    ),
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Add User',
    description: 'Create a new user account',
    href: '/users?action=new',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    label: 'Manage Users',
    description: 'View and manage all users',
    href: '/users',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    description: 'Configure site settings',
    href: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    label: 'My Profile',
    description: 'Update your admin profile',
    href: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();

  return (
    <div className="dash-page">
      <div className="dash-page__header">
        <h1 className="dash-page__title">Dashboard</h1>
        <p className="dash-page__subtitle">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {error && (
        <div className="alert alert--danger" role="alert">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          trend={stats ? { direction: 'up' as const, value: `${stats.activeUsers}`, label: 'active' } : undefined}
        />
        <StatCard
          title="Banned Users"
          value={stats?.bannedUsers ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
        <StatCard
          title="New This Month"
          value={stats?.newThisMonth ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          trend={
            stats
              ? { direction: 'up' as const, value: `${stats.newThisMonth}`, label: 'this month' }
              : undefined
          }
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="dash-grid-two">
        <div className="card dash-chart">
          <div className="card__header">
            <h2 className="card__title">User Growth</h2>
          </div>
          <div className="card__body">
            {isLoading ? (
              <div className="dash-chart__loading">
                <div className="spinner" />
              </div>
            ) : stats?.userGrowth && stats.userGrowth.length > 0 ? (
              <LineChart
                data={stats.userGrowth}
                height={200}
                color="var(--color-primary)"
              />
            ) : (
              <div className="dash-chart__loading">
                <span className="text-muted">No growth data available</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Quick Actions</h2>
          </div>
          <div className="card__body">
            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="quick-action-card">
                  <span className="quick-action-card__icon">{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Recent Signups</h2>
          <Link href="/users" className="btn btn--ghost btn--sm">
            View all
          </Link>
        </div>
        <div className="card__body card__body--flush">
          <DataTable
            columns={recentColumns}
            data={stats?.recentSignups ?? []}
            isLoading={isLoading}
            emptyMessage="No recent signups"
          />
        </div>
      </div>
    </div>
  );
}
