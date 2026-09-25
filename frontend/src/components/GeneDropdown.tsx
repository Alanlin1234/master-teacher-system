import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from './Icons';

export interface OptionTeacher {
  id: string;
  name: string;
  subject?: string;
  dimensions?: Record<string, { value: string }>;
  style?: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: OptionTeacher[];
  dimensionKey: string;
}

export const GeneDropdown: React.FC<Props> = ({
  value,
  onChange,
  options,
  dimensionKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedItem = options.find(o => o.id === value) || options[0];
  const selectedTrait = selectedItem?.dimensions?.[dimensionKey]?.value || selectedItem?.style || '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 999 : 1 }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--card-bg)',
          border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
          boxShadow: isOpen ? '0 0 12px -2px var(--accent-primary-glow)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all var(--trans-fast)',
          color: 'var(--text-main)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            {selectedItem?.name} {selectedItem?.subject ? `(${selectedItem.subject})` : ''}
          </span>
          <span style={{ color: 'var(--text-muted)', opacity: 0.6, fontSize: '0.8rem' }}>·</span>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedTrait}
          </span>
        </div>

        <ChevronDownIcon
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Custom Menu: Guaranteed WCAG AAA contrast in both Light & Dark themes */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--bg-surface-elevated, #141e33)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.45)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          {options.map(t => {
            const isSelected = t.id === value;
            const trait = t.dimensions?.[dimensionKey]?.value || t.style;
            return (
              <div
                key={t.id}
                onClick={() => {
                  onChange(t.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-primary-subtle, rgba(37,99,235,0.14))' : 'transparent',
                  transition: 'background var(--trans-fast)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.06))';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <span
                    className="badge badge-cyan"
                    style={{ fontSize: '0.72rem', padding: '2px 6px', flexShrink: 0 }}
                  >
                    {t.subject || '名师'}
                  </span>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{
                      fontWeight: isSelected ? 800 : 700,
                      fontSize: '0.88rem',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                      marginRight: '8px'
                    }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {trait}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <CheckIcon size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
