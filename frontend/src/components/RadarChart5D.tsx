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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="neonRadarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* 同心微晶网格 */}
        {gridPaths.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill={idx === gridPaths.length - 1 ? 'rgba(15, 23, 42, 0.65)' : 'none'}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray={idx < 3 ? '2 4' : 'none'}
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
              stroke="rgba(255, 255, 255, 0.08)"
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
          filter="drop-shadow(0 0 10px rgba(56, 189, 248, 0.6))"
          style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* 荧光顶点与外显高精标签 */}
        {DIMENSIONS.map((dim, i) => {
          const val = scores[dim.key] ?? 0.85;
          const { x, y } = getCoordinates(Math.min(1.0, Math.max(0.2, val)), i);
          const labelCoord = getCoordinates(1.24, i);

          return (
            <g key={dim.key}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#ffffff"
                stroke={highlightColor}
                strokeWidth="2.5"
              />
              {showLabels && (
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11px"
                  fontWeight="700"
                  fill="#94a3b8"
                  letterSpacing="0.02em"
                >
                  {dim.label} <tspan fill="#38bdf8">{Math.round(val * 100)}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
