import React, { useState } from 'react';

interface Props {
  scores?: Record<string, number>;
  size?: number;
  highlightColor?: string;
  showLabels?: boolean;
  showComposite?: boolean;
}

const DIMENSIONS = [
  { key: 'style', label: '上课风格', desc: '先问启发 vs 严密实证' },
  { key: 'personality', label: '人格特征', desc: '亲切风趣 vs 沉稳严谨' },
  { key: 'strengths', label: '核心优点', desc: '模型精炼 vs 极简直观' },
  { key: 'method', label: '教学方法', desc: '数形结合 vs 公理推导' },
  { key: 'communication', label: '沟通方式', desc: '循序渐进 vs 宏观破局' },
];

export const RadarChart5D: React.FC<Props> = ({
  scores = {},
  size = 280,
  highlightColor = 'var(--accent-primary)',
  showLabels = true,
  showComposite = true,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const center = size / 2;
  const radius = (size / 2) * 0.68;
  const count = DIMENSIONS.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { x, y };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridLevels.map(level => {
    return DIMENSIONS.map((_, i) => {
      const { x, y } = getCoordinates(level, i);
      return `${x},${y}`;
    }).join(' ');
  });

  const dataPoints = DIMENSIONS.map((dim, i) => {
    const val = scores[dim.key] ?? 0.85;
    const { x, y } = getCoordinates(Math.min(1.0, Math.max(0.2, val)), i);
    return `${x},${y}`;
  }).join(' ');

  const scoreValues = Object.values(scores);
  const avg = scoreValues.length > 0
    ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    : 0.88;
  const compositeScore = Math.round(avg * 100);

  const activeDim = DIMENSIONS.find(d => d.key === hoveredKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="neonRadarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.06" />
          </radialGradient>
          <filter id="radarVertexGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 同心微晶网格 */}
        {gridPaths.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill={idx === gridPaths.length - 1 ? 'var(--bg-glass-subtle)' : 'none'}
            stroke="var(--border-glass)"
            strokeWidth="1"
            strokeDasharray={idx < 3 ? '3 3' : 'none'}
          />
        ))}

        {/* 放射轴线 */}
        {DIMENSIONS.map((dim, i) => {
          const { x, y } = getCoordinates(1.0, i);
          const isHovered = hoveredKey === dim.key;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={isHovered ? 'var(--accent-primary)' : 'var(--border-glass)'}
              strokeWidth={isHovered ? '2' : '1'}
              style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
            />
          );
        })}

        {/* 荧光数据多边形 */}
        <polygon
          points={dataPoints}
          fill="url(#neonRadarGlow)"
          stroke={highlightColor}
          strokeWidth="2.5"
          filter="url(#radarVertexGlow)"
          style={{ transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {showComposite && (
          <g style={{ cursor: 'pointer' }}>
            <circle
              cx={center}
              cy={center}
              r={18}
              fill="var(--card-bg)"
              stroke={highlightColor}
              strokeWidth="2"
              box-shadow="0 0 12px rgba(59, 130, 246, 0.4)"
            />
            <circle
              cx={center}
              cy={center}
              r={14}
              fill="var(--accent-primary-subtle)"
            />
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12px"
              fontWeight="800"
              fill="var(--text-main)"
              className="tabular-nums"
            >
              {compositeScore}
            </text>
          </g>
        )}

        {/* 荧光顶点与外显高精标签 */}
        {DIMENSIONS.map((dim, i) => {
          const val = scores[dim.key] ?? 0.85;
          const { x, y } = getCoordinates(Math.min(1.0, Math.max(0.2, val)), i);
          const labelCoord = getCoordinates(1.24, i);
          const isHovered = hoveredKey === dim.key;

          return (
            <g
              key={dim.key}
              onMouseEnter={() => setHoveredKey(dim.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Vertex glow */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? 'var(--accent-primary)' : 'var(--card-bg)'}
                stroke={highlightColor}
                strokeWidth={isHovered ? 3 : 2}
                filter="url(#radarVertexGlow)"
                style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {showLabels && (
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12px"
                  fontWeight={isHovered ? '800' : '650'}
                  fill={isHovered ? 'var(--text-main)' : 'var(--text-body)'}
                  letterSpacing="0.02em"
                  style={{ transition: 'fill 0.2s ease' }}
                >
                  {dim.label} <tspan fill="var(--accent-primary)" fontWeight="800">{Math.round(val * 100)}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Interactive Micro-Tooltip */}
      {activeDim && (
        <div style={{
          position: 'absolute',
          bottom: -18,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: '9999px',
          padding: '3px 12px',
          fontSize: '11px',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 750 }}>{activeDim.label}</span>
          <span style={{ color: 'var(--text-muted)' }}>{activeDim.desc}</span>
        </div>
      )}
    </div>
  );
};
