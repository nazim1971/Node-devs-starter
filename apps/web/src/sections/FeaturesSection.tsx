const FEATURES = [
  {
    icon: '⚡',
    title: 'Blazing Fast DX',
    desc: 'Yarn workspaces monorepo with shared types, schemas, and utilities. No duplicated code, no context switching.',
  },
  {
    icon: '🔐',
    title: 'Auth Out of the Box',
    desc: 'JWT access + refresh tokens, Redis session store, token rotation, bcrypt hashing, and role-based guards.',
  },
  {
    icon: '☁️',
    title: 'Cloud Ready',
    desc: 'Cloudinary image uploads with signed URL generation. PostgreSQL + Redis via Docker Compose for local dev.',
  },
  {
    icon: '🎨',
    title: 'Design System Included',
    desc: 'Pure CSS design tokens, fluid typography, dark/light mode, and a full component library — no Tailwind needed.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="features-section" aria-label="Features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Everything you need</span>
          <h2 className="section-title">Built for production from day one</h2>
          <p className="section-subtitle">
            Stop configuring, start building. This template ships with every
            integration you need for a serious full-stack product.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
