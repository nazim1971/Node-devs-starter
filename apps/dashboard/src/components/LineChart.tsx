'use client';

import React, { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function LineChart({
  data,
  width = 600,
  height = 200,
  color = 'var(--color-primary)',
  className = '',
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const { minValue, maxValue, points, pathD, areaD } = useMemo(() => {
    if (data.length === 0) {
      return { minValue: 0, maxValue: 0, points: [], pathD: '', areaD: '' };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddedMin = Math.max(0, min - range * 0.1);
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin || 1;

    const pts = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
      y: padding.top + innerHeight - ((d.value - paddedMin) / paddedRange) * innerHeight,
      label: d.label,
      value: d.value,
    }));

    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');

    const area =
      `M ${pts[0].x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} ` +
      pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} Z`;

    return {
      minValue: paddedMin,
      maxValue: paddedMax,
      points: pts,
      pathD: d,
      areaD: area,
    };
  }, [data, innerWidth, innerHeight, padding.left, padding.top]);

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + ((maxValue - minValue) / (yTicks - 1)) * i;
  });

  return (
    <div className={`line-chart ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="User growth line chart"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines */}
        {yTickValues.map((tick, i) => {
          const y =
            padding.top +
            innerHeight -
            ((tick - minValue) / (maxValue - minValue || 1)) * innerHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--color-text-muted)"
                fontFamily="var(--font-sans)"
              >
                {Math.round(tick).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && (
          <path d={areaD} fill="url(#area-gradient)" />
        )}

        {/* Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points + X-axis labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--color-bg-card)"
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={padding.top + innerHeight + 24}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-text-muted)"
              fontFamily="var(--font-sans)"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
