const TESTIMONIALS = [
  {
    text: "This monorepo template saved us weeks of setup. The auth system alone is worth it — refresh token rotation, Redis blacklisting, all working out of the box.",
    name: 'Sarah Chen',
    role: 'CTO at Flowbase',
    initials: 'SC',
    stars: 5,
  },
  {
    text: "Finally a template that doesn't compromise on code quality. Strict TypeScript, shared Zod schemas, clean module boundaries. Exactly how I want to start a project.",
    name: 'Marcus Osei',
    role: 'Senior Engineer at Stripe',
    initials: 'MO',
    stars: 5,
  },
  {
    text: "The CSS design system is wild — no Tailwind, no dependencies, just clean variables and components. I forked this and shipped a SaaS product in 3 weeks.",
    name: 'Priya Nair',
    role: 'Indie Hacker',
    initials: 'PN',
    stars: 5,
  },
  {
    text: "NestJS + TypeORM fully configured with Redis, Cloudinary, and a multi-role guard system. This is what a production starter should look like.",
    name: 'David Kowalski',
    role: 'Lead Dev at Accenture',
    initials: 'DK',
    stars: 5,
  },
  {
    text: "I have evaluated 20+ starter kits over the years. This is the only one where I didn't need to uninstall or rewrite anything before going to production.",
    name: 'Amara Diallo',
    role: 'Fullstack Architect',
    initials: 'AD',
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="testimonial-stars" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="testimonials-section" aria-label="Testimonials">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">What developers say</span>
          <h2 className="section-title">Loved by engineers worldwide</h2>
        </div>
      </div>

      <div className="testimonials-scroll-wrapper">
        <div className="testimonials-track" role="list">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="testimonial-card" role="listitem">
              <Stars count={t.stars} />
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-initials" aria-hidden="true">
                  {t.initials}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
