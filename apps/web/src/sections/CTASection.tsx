import Link from 'next/link';

export function CTASection() {
  return (
    <section className="cta-section" aria-label="Call to action">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Ready to build something great?</h2>
          <p className="cta-subtitle">
            Start your next full-stack project with a battle-tested foundation.
            Free, open source, and ready in minutes.
          </p>
          <div className="hero-cta" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="btn btn--white btn--lg">
              Create free account
            </Link>
            <a
              href="https://github.com"
              className="btn btn--outline-white btn--lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star on GitHub ★
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
