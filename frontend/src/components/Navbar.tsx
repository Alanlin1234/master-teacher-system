import React from 'react';
import { useAuth } from '../store/authStore';
import {
  LayoutGridIcon,
  GraduationCapIcon,
  MessageSquareIcon,
  DnaIcon,
  VideoCameraIcon,
  SparklesIcon,
  UserIcon,
} from './Icons';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth();

  const navItems = [
    { key: 'home', label: '品牌首页', Icon: LayoutGridIcon },
    { key: 'library', label: '名师智库', Icon: GraduationCapIcon },
    { key: 'chat', label: '1对1伴学', Icon: MessageSquareIcon },
    { key: 'compose', label: '名师合成', Icon: DnaIcon },
    { key: 'studio', label: '微课工坊', Icon: VideoCameraIcon },
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
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 60%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <SparklesIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
              循智导学 · 名师智教
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', fontWeight: 600, letterSpacing: '0.08em' }}>
              MASTER TEACHER & DIGITAL AVATAR
            </div>
          </div>
        </div>

        {/* Linear Segmented Glass Navigation (Zero Emoji) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: 'var(--radius-full)',
          padding: '3px 5px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
        }}>
          {navItems.map(item => {
            const isActive = activeTab === item.key;
            const ItemIcon = item.Icon;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 15px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--trans-fast)',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <ItemIcon size={15} style={{ color: isActive ? 'var(--cyan-neon)' : 'inherit' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account / Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)'
              }}>
                <UserIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                  {user.username}
                </span>
                <span
                  className={`badge ${user.role === 'admin' ? 'badge-amber' : user.portalRole === 'teacher' ? 'badge-blue' : 'badge-emerald'}`}
                  style={{ fontSize: '0.66rem', padding: '1px 6px' }}
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
