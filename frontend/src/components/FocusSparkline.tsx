import React, { useEffect, useId, useRef } from 'react';
import { easings, prefersReducedMotion } from '../lib/gsap';

interface Props {
  values: number[];
}

export const FocusSparkline: React.FC<Props> = ({ values }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const gradId = useId();

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    if (prefersReducedMotion() || !length) {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '0';
      return;
    }
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      path.style.strokeDashoffset = String(length * (1 - easings.power3Out(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [values]);

  if (values.length < 2) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>还没有专注采样</p>;
  }

  const w = 320;
  const h = 72;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((value, index) => {
    const x = (index / (values.length - 1)) * w;
    const y = h - ((value - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const d = pts.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
      <path ref={pathRef} d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" />
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
};
