import React, { useState, useEffect } from 'react';
import { teachersApi } from '../services/api';
import { RadarChart5D } from '../components/RadarChart5D';
import {
  GraduationCapIcon,
  SearchIcon,
  CheckIcon,
  ChevronRightIcon,
  DnaIcon,
  MessageSquareIcon,
  CloseIcon,
  BookOpenIcon,
  SlidersIcon,
} from '../components/Icons';

interface Props {
  onStartChat: (teacherId: string) => void;
  onAddToCompose: (teacherId: string) => void;
}

const getSafeAvatarUrl = (url?: string, defaultId: string = '1') => {
  if (!url) return `./avatars/t${defaultId.replace(/\D/g, '') || '1'}.svg`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return '.' + url;
  return url;
};

export const TeacherLibraryPage: React.FC<Props> = ({ onStartChat, onAddToCompose }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [searchKey, setSearchKey] = useState('');
  const [activeTeacher, setActiveTeacher] = useState<any | null>(null);

  const subjects = ['全部', '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await teachersApi.list();
      if (res.ok) setTeachers(res.teachers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchSub = selectedSubject === '全部' || t.subject === selectedSubject;
    const matchSearch = !searchKey.trim() ||
      t.name.includes(searchKey) ||
      t.description.includes(searchKey) ||
      t.style.includes(searchKey);
    return matchSub && matchSearch;
  });

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 64px', position: 'relative' }}>
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部标题区 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <GraduationCapIcon size={20} />
              </div>
              <h1 className="brand-display" style={{ fontSize: '2.1rem', color: '#ffffff', letterSpacing: '-0.03em' }}>
                全国金牌名师智库
              </h1>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              收录 17+ 各学科特级名师，支持全维教学风格解构、1对1数字人伴学与基因萃取
            </p>
          </div>

          {/* 搜索框 (纯 SVG 矢量放大镜，无 Emoji) */}
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              placeholder="搜索名师姓名、教学风格..."
              className="input-luxury"
              style={{
                borderRadius: 'var(--radius-full)',
                paddingLeft: '40px'
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--accent-primary)' }}>
              <SearchIcon size={16} />
            </span>
          </div>
        </div>

        {/* 学科过滤 Tabs (统一百年学府钴蓝微晶胶囊) */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '32px' }}>
          {subjects.map(s => {
            const isSel = selectedSubject === s;
            return (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                style={{
                  padding: '7px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: isSel ? 700 : 500,
                  border: isSel ? '1px solid var(--accent-primary-border)' : '1px solid var(--border-glass)',
                  background: isSel ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSel ? '#ffffff' : 'var(--text-body)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSel ? '0 2px 14px var(--accent-primary-glow)' : 'none',
                  transition: 'all var(--trans-fast)'
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* 名师卡片网格 (Impeccable Grid Architecture) */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            正在加载名师智库档案...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            未找到符合条件的名师
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '24px'
          }}>
            {filteredTeachers.map(t => (
              <div
                key={t.id}
                className="card-impeccable"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* 教师头像、姓名与学科 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at 50% 35%, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.85))',
                    border: '1px solid rgba(56, 189, 248, 0.28)',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px'
                  }}>
                    <img
                      src={getSafeAvatarUrl(t.photoUrl, t.id)}
                      alt={t.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = './avatars/t1.svg';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                        {t.name}
                      </h3>
                      <span className="badge badge-blue">
                        {t.subject}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--cyan-neon)', fontWeight: 600, marginTop: '2px' }}>
                      {t.style}
                    </div>
                  </div>
                </div>

                {/* 描述与优点 */}
                <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: '1.55', marginBottom: '14px', minHeight: '40px' }}>
                  {t.description}
                </p>

                {/* 核心优点标签 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {t.strengths?.slice(0, 2).map((s: string, idx: number) => (
                    <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                      <CheckIcon size={11} style={{ marginRight: '3px' }} />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>

                {/* 底部行动栏 (无 Emoji，全矢量) */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setActiveTeacher(t)}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.82rem', padding: '6px 10px', color: 'var(--cyan-neon)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>查看画像</span>
                    <ChevronRightIcon size={13} />
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onAddToCompose(t.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      title="把该老师基因加入合成工坊"
                    >
                      <DnaIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
                      <span>基因合成</span>
                    </button>
                    <button
                      onClick={() => onStartChat(t.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <MessageSquareIcon size={14} />
                      <span>1对1辅导</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 侧边全景档案抽屉 (Full Profile Drawer) */}
        {activeTeacher && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 9, 17, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '560px',
              height: '100%',
              background: '#0b1120',
              borderLeft: '1px solid var(--border-glass)',
              boxShadow: '0 0 60px rgba(0, 0, 0, 0.8)',
              padding: '36px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* 抽屉头部 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cyan-neon)'
                  }}>
                    <GraduationCapIcon size={18} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>
                    名师全维教学画像
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTeacher(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CloseIcon size={14} />
                </button>
              </div>

              {/* 教师名片 */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at 50% 35%, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.9))',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  flexShrink: 0,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}>
                  <img
                    src={getSafeAvatarUrl(activeTeacher.photoUrl, activeTeacher.id)}
                    alt={activeTeacher.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = './avatars/t1.svg';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#ffffff' }}>{activeTeacher.name}</h3>
                    <span className="badge badge-blue">{activeTeacher.subject}</span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {activeTeacher.description}
                  </p>
                </div>
              </div>

              {/* 五维能力雷达图 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: 'var(--cyan-neon)',
                  marginBottom: '14px',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <SlidersIcon size={14} />
                  <span>五维度教学基因解构雷达</span>
                </div>
                <RadarChart5D scores={activeTeacher.dimScores} size={250} highlightColor="#38bdf8" />
              </div>

              {/* 讲义与课件列表 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
                  <span>名师代表讲义与考点剖析 ({activeTeacher.materials?.length || 0})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeTeacher.materials?.map((m: any) => (
                    <div key={m.id} style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>{m.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>类型：{m.type} · 上传日期：{m.uploadDate}</div>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>已建档</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部行动 */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const id = activeTeacher.id;
                    setActiveTeacher(null);
                    onAddToCompose(id);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <DnaIcon size={15} style={{ color: 'var(--cyan-neon)' }} />
                  <span>加入合成工坊</span>
                </button>
                <button
                  onClick={() => {
                    const id = activeTeacher.id;
                    setActiveTeacher(null);
                    onStartChat(id);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <MessageSquareIcon size={15} />
                  <span>立即发起辅导</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
