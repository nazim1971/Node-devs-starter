'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';

const STATS = [
  { value: 10000, suffix: '+', label: 'Developers', decimals: 0, format: true },
  { value: 99,    suffix: '%', label: 'Uptime SLA',  decimals: 0, format: false },
  { value: 150,   suffix: '+', label: 'Countries',   decimals: 0, format: false },
  { value: 4.9,   suffix: '/5', label: 'User Rating', decimals: 1, format: false },
] as const;

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  decimals: number;
  format: boolean;
}

function StatItem({ value, suffix, label, decimals, format }: StatItemProps) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 2000, started, decimals);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display = format ? Number(count).toLocaleString() : count;

  return (
    <div ref={ref} className="stat-item">
      <div className="stat-number">
        {display}
        <span className="stat-suffix">{suffix}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function StatsSection() {
  return (
    <section id="stats" className="stats-section" aria-label="Stats">
      <div className="container">
        <div className="section-header" style={{ position: 'relative' }}>
          <span className="section-eyebrow">Trusted worldwide</span>
          <h2 className="section-title">Numbers that speak for themselves</h2>
        </div>

        <div className="stats-grid">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
