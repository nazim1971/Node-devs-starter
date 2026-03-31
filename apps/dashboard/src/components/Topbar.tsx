'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../providers/AuthProvider';

function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Dashboard', href: '/' }];

  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
}

export function Topbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">{pageTitle}</h1>
        <nav className="topbar__breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="breadcrumb__item">
                {i < breadcrumbs.length - 1 ? (
                  <>
                    <Link href={crumb.href} className="breadcrumb__link">
                      {crumb.label}
                    </Link>
                    <span className="breadcrumb__sep" aria-hidden="true">/</span>
                  </>
                ) : (
                  <span className="breadcrumb__current" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="topbar__right">
        <ThemeToggle />

        <button
          type="button"
          className="topbar__notif-btn btn btn--icon btn--ghost"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className="topbar__user-menu">
          <button
            type="button"
            className="topbar__user-btn"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            aria-label="User menu"
          >
            <div className="topbar__user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="topbar__avatar-img" />
              ) : (
                <span className="topbar__avatar-initials">
                  {user?.name.slice(0, 2).toUpperCase() ?? 'AD'}
                </span>
              )}
            </div>
            <span className="topbar__user-name">{user?.name ?? 'Admin'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {userMenuOpen && (
            <div
              className="topbar__dropdown"
              role="menu"
              onBlur={() => setUserMenuOpen(false)}
            >
              <Link
                href="/profile"
                className="topbar__dropdown-item"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="topbar__dropdown-item"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                Settings
              </Link>
              <div className="topbar__dropdown-divider" role="separator" />
              <button
                type="button"
                className="topbar__dropdown-item topbar__dropdown-item--danger"
                role="menuitem"
                onClick={async () => {
                  setUserMenuOpen(false);
                  await logout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
