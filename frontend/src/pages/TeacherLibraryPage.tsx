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
import { Volume2, VolumeX, Award } from 'lucide-react';
import { speechService } from '../services/speech';
import { SkeletonCard } from '../components/SkeletonCard';

interface Props {
  onStartChat: (teacherId: string) => void;
  onAddToCompose: (teacherId: string) => void;
}

const getSafeAvatarUrl = (_url?: string, defaultId: string = '1') => {
  const num = defaultId.replace(/\D/g, '') || '1';
  return `./photos/${num}.png`;
};

export const TeacherLibraryPage: React.FC<Props> = ({ onStartChat, onAddToCompose }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [searchKey, setSearchKey] = useState('');
  const [activeTeacher, setActiveTeacher] = useState<any | null>(null);
  const [playingMasterId, setPlayingMasterId] = useState<string | null>(null);

  const toggleMasterAudio = (t: any) => {
    if (playingMasterId === t.id) {
      speechService.stop();
      setPlayingMasterId(null);
    } else {
      speechService.stop();
      setPlayingMasterId(t.id);
      speechService.speak(
        `同学你好！我是${t.subject}特级名师${t.name}。${t.description || t.style}`,
        () => setPlayingMasterId(t.id),
        () => setPlayingMasterId(null)
      );
    }
  };

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
              <h1 className="brand-display" style={{ fontSize: '2.1rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                全国金牌名师智库
              </h1>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              收录 17+ 各学科特级名师，支持全维教学风格解构、1对1数字人伴学与基因萃取
            </p>
          </div>

          {/* 搜索框 */}
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

        {/* 学科过滤 Tabs */}
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
                  border: isSel ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                  background: isSel ? 'var(--accent-primary)' : 'var(--card-bg)',
                  color: isSel ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSel ? 'var(--shadow-sm)' : 'none',
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
          <SkeletonCard count={6} />
        ) : filteredTeachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            未找到符合条件的名师
          </div>
        ) : (
          <div className="library-master-grid">
            {filteredTeachers.map(t => {
              const isPlaying = playingMasterId === t.id;
              return (
                <div
                  key={t.id}
                  className="library-master-card"
                >
                  <div className="library-photo-viewport">
                    <img
                      src={getSafeAvatarUrl(t.photoUrl, t.id)}
                      alt={t.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = './photos/1.png';
                      }}
                    />
                    <div className="master-gallery-photo-gradient" />
                    <div className="master-subject-badge-clean">
                      <Award size={12} />
                      <span>{t.subject} · 特级名师</span>
                    </div>
                  </div>

                  <div className="master-gallery-body">
                    <div className="master-card-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <h3 className="master-card-name">{t.name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 650 }}>
                          {t.style}
                        </span>
                      </div>
                      <div className="master-card-exp">
                        {t.experience || `${t.school || '领军中学'} · 骨干教研名师`}
                      </div>
                    </div>

                    <p className="master-card-quote">
                      “{t.description || t.quote || '启发式思维建构，带你突破每一个认知断层。'}”
                    </p>

                    <div className="master-card-footer-clean">
                      <button
                        type="button"
                        className={`master-voice-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={() => toggleMasterAudio(t)}
                        title={isPlaying ? "停止原声" : "试听名师原声"}
                      >
                        {isPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{isPlaying ? '原声播报中' : '试听原声'}</span>
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveTeacher(t)}
                          className="btn btn-ghost"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          title="查看 5D 画像"
                        >
                          <span>画像</span>
                          <ChevronRightIcon size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartChat(t.id)}
                          className="master-1v1-btn"
                          style={{ padding: '6px 14px', fontSize: '11px' }}
                        >
                          <MessageSquareIcon size={12} />
                          <span>请教</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 侧边全景档案抽屉 (Full Profile Drawer) */}
        {activeTeacher && (
          <div 
            onClick={() => setActiveTeacher(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                height: '100%',
                background: 'var(--card-bg)',
                borderLeft: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-xl)',
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
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid var(--border-academic)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)'
                  }}>
                    <GraduationCapIcon size={18} />
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    名师全维教学画像
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTeacher(null)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="关闭"
                >
                  <CloseIcon size={14} />
                </button>
              </div>

              {/* 教师名片 */}
              <div style={{
                display: 'flex',
                gap: '18px',
                alignItems: 'flex-start',
                marginBottom: '24px',
                padding: '18px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border-glass)',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={getSafeAvatarUrl(activeTeacher.photoUrl, activeTeacher.id)}
                    alt={activeTeacher.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = './photos/1.png';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{activeTeacher.name}</h3>
                    <span className="badge badge-blue">{activeTeacher.subject}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: '1.65', fontWeight: 500, margin: 0 }}>
                    {activeTeacher.description}
                  </p>
                </div>
              </div>

              {/* 五维能力雷达图 */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  marginBottom: '14px',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <SlidersIcon size={14} />
                  <span>五维度教学基因解构雷达</span>
                </div>
                <RadarChart5D scores={activeTeacher.dimScores} size={250} highlightColor="var(--accent-primary)" />
              </div>

              {/* 讲义与课件列表 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>名师代表讲义与考点剖析 ({activeTeacher.materials?.length || 0})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeTeacher.materials?.map((m: any) => (
                    <div key={m.id} style={{
                      padding: '14px 18px',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginTop: '4px', fontWeight: 500 }}>
                          类型：<span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{m.type}</span> · 上传日期：<span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{m.uploadDate}</span>
                        </div>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.74rem', padding: '4px 10px', fontWeight: 600 }}>已建档</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部行动 */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  onClick={() => {
                    const id = activeTeacher.id;
                    setActiveTeacher(null);
                    onAddToCompose(id);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <DnaIcon size={15} style={{ color: 'var(--accent-primary)' }} />
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
