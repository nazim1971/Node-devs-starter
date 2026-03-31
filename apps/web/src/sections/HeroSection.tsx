'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="hero-section" aria-label="Hero">
      {/* Animated background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-dots" />
        <div className="hero-shape hero-shape--1" />
        <div className="hero-shape hero-shape--2" />
        <div className="hero-shape hero-shape--3" />
      </div>

      <div className="container">
        <div className="hero-content">
          <span className="hero-eyebrow">
            ✦ Open source · Production ready
          </span>

          <h1 className="hero-title">
            Ship faster with the{' '}
            <span className="gradient-text">ultimate stack</span>
          </h1>

          <p className="hero-subtitle">
            A production-grade full-stack monorepo template. Next.js, NestJS,
            PostgreSQL, Redis, Cloudinary — all wired up and ready to deploy.
          </p>

          <div className="hero-cta">
            <Link href="/register" className="btn btn--primary btn--lg">
              Get started free →
            </Link>
            <a
              href="https://github.com"
              className="btn btn--secondary btn--lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
