import React from 'react';

interface Props {
  count?: number;
}

export const SkeletonCard: React.FC<Props> = ({ count = 6 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
    gap: '24px'
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="card-impeccable skeleton-pulse"
        style={{ padding: 'var(--card-padding-md)', height: '220px' }}
      >
        <div className="skeleton-line" style={{ width: '40%', height: '20px' }} />
        <div className="skeleton-line" style={{ width: '80%', height: '14px', marginTop: '16px' }} />
        <div className="skeleton-line" style={{ width: '60%', height: '14px', marginTop: '8px' }} />
        <div className="skeleton-line" style={{ width: '90%', height: '14px', marginTop: '24px' }} />
        <div className="skeleton-line" style={{ width: '50%', height: '14px', marginTop: '8px' }} />
      </div>
    ))}
  </div>
);
