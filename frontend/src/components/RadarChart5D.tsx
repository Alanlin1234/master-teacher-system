import React from 'react';

interface Props {
  scores?: Record<string, number>;
  size?: number;
  highlightColor?: string;
  showLabels?: boolean;
}

const DIMENSIONS = [
  { key: 'style', label: '上课风格' },
  { key: 'personality', label: '人格特征' },
  { key: 'strengths', label: '核心优点' },
  { key: 'method', label: '教学方法' },
  { key: 'communication', label: '沟通方式' },
];

export const RadarChart5D: React.FC<Props> = ({
  scores = {},
  size = 280,
  highlightColor = '#38bdf8',
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.7;
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

  const avg = Object.values(scores).length > 0
    ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    : 0.88;
  const compositeScore = Math.round(avg * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="neonRadarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </radialGradient>
          <filter id="radarVertexGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
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
            strokeDasharray={idx < 3 ? '2 3' : 'none'}
          />
        ))}

        {/* 放射轴线 */}
        {DIMENSIONS.map((_, i) => {
          const { x, y } = getCoordinates(1.0, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--border-glass)"
              strokeWidth="1"
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

        {/* 中心综合基因指数基底 */}
        <circle
          cx={center}
          cy={center}
          r={16}
          fill="var(--card-bg)"
          stroke={highlightColor}
          strokeWidth="1.5"
          filter="drop-shadow(0 0 6px rgba(37, 99, 235, 0.3))"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10px"
          fontWeight="800"
          fill="var(--text-main)"
          className="tabular-nums"
        >
          {compositeScore}
        </text>

        {/* 荧光顶点与外显高精标签 */}
        {DIMENSIONS.map((dim, i) => {
          const val = scores[dim.key] ?? 0.85;
          const { x, y } = getCoordinates(Math.min(1.0, Math.max(0.2, val)), i);
          const labelCoord = getCoordinates(1.22, i);

          return (
            <g key={dim.key}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="var(--card-bg)"
                stroke={highlightColor}
                strokeWidth="2.5"
                filter="url(#radarVertexGlow)"
              />
              {showLabels && (
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10px"
                  fontWeight="700"
                  fill="var(--text-body)"
                  letterSpacing="0.02em"
                >
                  {dim.label} <tspan fill="var(--accent-primary)">{Math.round(val * 100)}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
