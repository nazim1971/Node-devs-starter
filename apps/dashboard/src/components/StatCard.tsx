'use client';

import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label?: string;
  };
  formatValue?: (n: number) => string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  formatValue,
  className = '',
}: StatCardProps) {
  const count = useCountUp(value);
  const displayValue = formatValue ? formatValue(count) : count.toLocaleString();

  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{title}</span>
        <span className="stat-card__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{displayValue}</span>
        {trend && (
          <div
            className={`stat-card__trend stat-card__trend--${trend.direction}`}
          >
            {trend.direction === 'up' && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            <span className="stat-card__trend-value">{trend.value}</span>
            {trend.label && (
              <span className="stat-card__trend-label">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
