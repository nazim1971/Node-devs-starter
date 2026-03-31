'use client';

import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';
import { useScrolled } from '../hooks/useScrolled';
import { useMobileMenu } from '../hooks/useMobileMenu';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#stats', label: 'Stats' },
  { href: '/#testimonials', label: 'Testimonials' },
];

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="site-logo" onClick={onClick}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        style={{ color: 'var(--color-primary)', flexShrink: 0 }}
      >
        <polygon
          points="14,2 26,8 26,20 14,26 2,20 2,8"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--color-primary-subtle)"
        />
        <polygon
          points="14,6 22,10 22,18 14,22 6,18 6,10"
          fill="currentColor"
          opacity="0.3"
        />
      </svg>
      <span className="site-logo__text">NodeStarter</span>
    </Link>
  );
}

export function Header() {
  const scrolled = useScrolled(10);
  const { isOpen, toggle, close } = useMobileMenu();
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
        <div className="container site-header__inner">
          <Logo onClick={close} />

          {/* Desktop nav */}
          <nav className="site-nav" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="site-nav__link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="site-header__actions">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="btn btn--ghost btn--sm">
                  Profile
                </Link>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => void logout()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn--ghost btn--sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn--primary btn--sm">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            className={`hamburger${isOpen ? ' hamburger--open' : ''}`}
            onClick={toggle}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </button>
        </div>
      </header>

      {/* Mobile slide menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu${isOpen ? ' mobile-menu--open' : ''}`}
        aria-hidden={!isOpen}
      >
        <nav className="mobile-menu__nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mobile-menu__link" onClick={close}>
              {link.label}
            </a>
          ))}

          <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }} />

          {isAuthenticated ? (
            <>
              <Link href="/profile" className="mobile-menu__link" onClick={close}>
                Profile
              </Link>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => { void logout(); close(); }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost" onClick={close}>
                Sign in
              </Link>
              <Link href="/register" className="btn btn--primary" onClick={close}>
                Get started
              </Link>
            </>
          )}

          <div style={{ paddingTop: 'var(--space-4)' }}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </>
  );
}
