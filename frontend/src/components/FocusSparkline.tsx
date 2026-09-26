import React, { useEffect, useId, useRef } from 'react';
import { easings, prefersReducedMotion } from '../lib/gsap';

interface Props {
  values: number[];
  height?: number;
  label?: string;
  showGlowMarker?: boolean;
}

export const FocusSparkline: React.FC<Props> = ({
  values,
  height = 76,
  label,
  showGlowMarker = true,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const strokeGradId = useId();
  const areaGradId = useId();

  const effectiveValues = values.length >= 2 ? values : [70, 75, 72, 78, 85, 82, 88, 92];
  const isDemo = values.length < 2;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    if (prefersReducedMotion() || !length) {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '0';
      if (areaRef.current) areaRef.current.style.opacity = '1';
      return;
    }
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    if (areaRef.current) areaRef.current.style.opacity = '0';

    const start = performance.now();
    const duration = 850;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easings.power3Out(t);
      path.style.strokeDashoffset = String(length * (1 - eased));
      if (areaRef.current) {
        areaRef.current.style.opacity = String(eased);
      }
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [values]);

  const w = 340;
  const h = height;
  const min = Math.min(...effectiveValues);
  const max = Math.max(...effectiveValues);
  const span = Math.max(1, max - min);
  const paddingY = 8;
  const usableH = h - paddingY * 2;

  const pts = effectiveValues.map((value, index) => {
    const x = (index / (effectiveValues.length - 1)) * (w - 12) + 6;
    const y = h - paddingY - ((value - min) / span) * usableH;
    return [x, y] as const;
  });

  // Generate smooth cubic bezier SVG path
  let lineD = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    lineD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }

  const lastPt = pts[pts.length - 1];
  const firstPt = pts[0];
  const areaD = `${lineD} L ${lastPt[0].toFixed(1)},${h} L ${firstPt[0].toFixed(1)},${h} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: 6, marginBottom: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
          {isDemo && (
            <span style={{ fontSize: '10px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '0.04em' }}>
              [示范波形]
            </span>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#0ea5e9" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${strokeGradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Subtle Background Guide Grid Lines */}
        <line x1="0" y1={h * 0.25} x2={w} y2={h * 0.25} stroke="var(--border-glass)" strokeDasharray="3 4" strokeWidth="0.8" opacity="0.6" />
        <line x1="0" y1={h * 0.75} x2={w} y2={h * 0.75} stroke="var(--border-glass)" strokeDasharray="3 4" strokeWidth="0.8" opacity="0.6" />

        {/* Gradient Fill Area */}
        <path ref={areaRef} d={areaD} fill={`url(#${areaGradId})`} />

        {/* High-Definition Bezier Waveform */}
        <path
          ref={pathRef}
          d={lineD}
          fill="none"
          stroke={`url(#${strokeGradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${strokeGradId})`}
        />

        {/* Dynamic Telemetry Marker */}
        {showGlowMarker && (
          <g transform={`translate(${lastPt[0]}, ${lastPt[1]})`}>
            <circle r="7" fill="#0ea5e9" opacity="0.25">
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="3.5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};
