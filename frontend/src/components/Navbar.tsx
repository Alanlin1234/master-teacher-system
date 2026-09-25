import React from 'react';
import { useAuth } from '../store/authStore';
import { useTheme } from '../store/themeStore';
import {
  LayoutGridIcon,
  GraduationCapIcon,
  VideoCameraIcon,
  SparklesIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
} from './Icons';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { key: 'collect', label: '采集', Icon: LayoutGridIcon },
    { key: 'diagnose', label: '诊断', Icon: SparklesIcon },
    { key: 'teachers', label: '名师', Icon: GraduationCapIcon },
    { key: 'studio', label: '呈现', Icon: VideoCameraIcon },
  ];

  return (
    <header className="glass-header">
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Brand Logo & Linear-Style Crystalline Icon */}
        <div
          onClick={() => onSelectTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 14px rgba(59, 130, 246, 0.35)',
            border: '1px solid rgba(96, 165, 250, 0.45)'
          }}>
            <SparklesIcon size={18} />
          </div>
          <div>
            <div className="brand-display" style={{ fontSize: '1.08rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              循智导学 · 名师智教
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.1em' }}>
              MASTER TEACHER & ACADEMIC AVATAR
            </div>
          </div>
        </div>

        {/* Linear Segmented Glass Navigation (Zero Emoji) */}
        <nav aria-label="主导航" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '3px 5px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {navItems.map(item => {
            const isActive = item.key === 'teachers'
              ? ['teachers', 'library', 'compose', 'chat'].includes(activeTab)
              : activeTab === item.key;
            const ItemIcon = item.Icon;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className="nav-tab"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <ItemIcon size={15} className="nav-tab-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account / Theme Toggle Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 一键极简双主题切换按钮 (Apple/Linear 质感) */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-subtle)'
            }}
            title={theme === 'dark' ? '点击切换至极简高对比学术白' : '点击切换至黑曜石深色模式'}
          >
            {theme === 'dark' ? (
              <>
                <SunIcon size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>浅色</span>
              </>
            ) : (
              <>
                <MoonIcon size={14} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>深色</span>
              </>
            )}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-glass)'
              }}>
                <UserIcon size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.username}
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-primary-subtle)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary-border)',
                    fontWeight: 700
                  }}
                >
                  {user.role === 'admin' ? '管理员' : user.portalRole === 'teacher' ? '名师' : '学生'}
                </span>
              </div>
              <button
                onClick={() => onSelectTab('auth')}
                className="btn btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                title="切换账号"
              >
                切换
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('auth')}
              className="btn btn-primary"
              style={{ padding: '7px 18px', fontSize: '0.84rem' }}
            >
              登录 / 注册
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
