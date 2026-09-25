import React, { useState } from 'react';
import { useAuth } from '../store/authStore';
import { authApi } from '../services/api';
import {
  CheckIcon,
  AlertCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserIcon,
} from '../components/Icons';

interface Props {
  onSuccess: () => void;
}

export const AuthPage: React.FC<Props> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [portalRole, setPortalRole] = useState<'student' | 'teacher'>('student');
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 一键填入演示账号
  const handleFillDemo = (userType: 'student' | 'teacher' | 'admin') => {
    if (userType === 'student') {
      setUsername('demo_student');
      setPassword('123456');
    } else if (userType === 'teacher') {
      setUsername('demo_teacher');
      setPassword('123456');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
    setAlert({ type: 'success', message: `已成功填入 ${userType} 预置测试账号，点击登录即可进入` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAlert({ type: 'error', message: '请输入用户名和密码' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      if (isLoginTab) {
        const res = await authApi.login(username, password);
        login({
          id: res.id,
          username: res.username,
          role: res.role,
          portalRole: res.portalRole as any,
          token: res.token
        });
        setAlert({ type: 'success', message: '登录成功！正在进入系统...' });
        setTimeout(() => onSuccess(), 500);
      } else {
        const res = await authApi.register({
          username,
          password,
          portal_role: portalRole,
          email
        });
        login({
          id: res.id,
          username: res.username,
          role: res.role,
          portalRole: res.portalRole as any,
          token: res.token
        });
        setAlert({ type: 'success', message: '注册成功！已自动登录' });
        setTimeout(() => onSuccess(), 500);
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || '操作失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-glow-bg" style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        width: '100%',
        maxWidth: '880px',
        minHeight: '560px',
        overflow: 'hidden',
        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px -8px rgba(56, 189, 248, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 左侧品牌展示区 (Dark Obsidian & Cosmic Cyan Architecture) */}
        <div style={{
          background: 'linear-gradient(165deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(8, 145, 178, 0.3) 100%)',
          borderRight: '1px solid var(--border-glass)',
          color: '#fff',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Logo Badge */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.35))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 20px -4px rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-neon)',
            marginBottom: '20px'
          }}>
            <SparklesIcon size={20} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.03em' }}>
            循智导学 · 名师智教
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '36px', lineHeight: '1.5' }}>
            名师基因解构 · 五维全息图谱 · 数字人伴学
          </p>

          {/* 价值点清单 (纯 SVG 矢量图标) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: 'auto' }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5', color: '#e2e8f0', alignItems: 'center' }}>
              <CheckIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
              <span>海量名师档案与五维教学基因透视</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5', color: '#e2e8f0', alignItems: 'center' }}>
              <CheckIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
              <span>4K 超清数字人多模态双向语音伴学</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5', color: '#e2e8f0', alignItems: 'center' }}>
              <CheckIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
              <span>自由萃取维度，合成专属虚拟特级导师</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5', color: '#e2e8f0', alignItems: 'center' }}>
              <CheckIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
              <span>微课视频自动化渲染与切片工坊</span>
            </div>
          </div>

          {/* 底部保障标签 */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-glass)'
          }}>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--cyan-neon)', letterSpacing: '-0.02em' }} className="tabular-nums">
              100%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              学习进度与答疑问答记录专属加密保存
            </div>
          </div>
        </div>

        {/* 右侧表单操作区 */}
        <div style={{ padding: '44px 48px', display: 'flex', flexDirection: 'column', background: 'rgba(11, 17, 32, 0.6)' }}>
          {/* Tab 切换 */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '28px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
            <button
              onClick={() => { setIsLoginTab(true); setAlert(null); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.18rem',
                fontWeight: isLoginTab ? 800 : 500,
                color: isLoginTab ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '8px',
                transition: 'all var(--trans-fast)'
              }}
            >
              账号登录
              {isLoginTab && (
                <div style={{
                  position: 'absolute',
                  bottom: '-15px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--cyan-neon), var(--blue-neon))',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)'
                }} />
              )}
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setAlert(null); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.18rem',
                fontWeight: !isLoginTab ? 800 : 500,
                color: !isLoginTab ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '8px',
                transition: 'all var(--trans-fast)'
              }}
            >
              注册新用户
              {!isLoginTab && (
                <div style={{
                  position: 'absolute',
                  bottom: '-15px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--cyan-neon), var(--blue-neon))',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)'
                }} />
              )}
            </button>
          </div>

          {/* 提示信息 (全矢量图标，零 Emoji) */}
          {alert && (
            <div style={{
              padding: '11px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: alert.type === 'error' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: alert.type === 'error' ? '#fb7185' : '#34d399',
              border: `1px solid ${alert.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {alert.type === 'error' ? <AlertCircleIcon size={16} /> : <CheckIcon size={16} />}
              <span>{alert.message}</span>
            </div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '7px', color: 'var(--text-body)' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-luxury"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '7px', color: 'var(--text-body)' }}>
                登录密码
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="input-luxury"
              />
            </div>

            {!isLoginTab && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '7px', color: 'var(--text-body)' }}>
                    注册角色身份
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={portalRole === 'student'}
                        onChange={() => setPortalRole('student')}
                        style={{ accentColor: 'var(--cyan-neon)' }}
                      />
                      <span>学生体验</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={portalRole === 'teacher'}
                        onChange={() => setPortalRole('teacher')}
                        style={{ accentColor: 'var(--cyan-neon)' }}
                      />
                      <span>名师教研</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '7px', color: 'var(--text-body)' }}>
                    联系邮箱 (选填)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="用于密码找回与通知"
                    className="input-luxury"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.98rem', marginTop: '10px' }}
            >
              {loading ? '正在处理...' : isLoginTab ? '登 录' : '立即注册'}
            </button>
          </form>

          {/* 一键快捷体验账号面板 */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px dashed var(--border-glass)'
          }}>
            <div style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <ShieldCheckIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
              <span>快捷体验通道（免注册秒级填入）</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 12px', borderRadius: 'var(--radius-sm)' }}
              >
                <UserIcon size={13} style={{ color: 'var(--cyan-neon)' }} />
                <span>学生 (demo_student)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('teacher')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 12px', borderRadius: 'var(--radius-sm)' }}
              >
                <UserIcon size={13} style={{ color: '#60a5fa' }} />
                <span>名师 (demo_teacher)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 12px', borderRadius: 'var(--radius-sm)' }}
              >
                <UserIcon size={13} style={{ color: '#fbbf24' }} />
                <span>管理员 (admin)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
