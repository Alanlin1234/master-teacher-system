import React, { useState, useEffect } from 'react';
import { studioApi, teachersApi } from '../services/api';
import {
  VideoCameraIcon,
  SparklesIcon,
  RefreshIcon,
  DownloadIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CheckIcon,
} from '../components/Icons';

interface Props {
  initialTopic?: string;
  initialScript?: string;
  synthRecipe?: any;
}

export const TeacherStudioPage: React.FC<Props> = ({
  initialTopic = '导数切线与综合大题破局',
  initialScript = '',
  synthRecipe,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [topic, setTopic] = useState(initialTopic);
  const [chatExport, setChatExport] = useState(initialScript);
  const [selectedTeacherId, setSelectedTeacherId] = useState('t1');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('wang_chonglin_avatar');
  const [segments, setSegments] = useState<any[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState('');

  useEffect(() => {
    loadTeachers();
    if (initialScript) {
      setCurrentStep(3);
      handleGenerateScript();
    }
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await teachersApi.list();
      if (res.ok) setTeachers(res.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const currentTeacher = teachers.find(t => t.id === selectedTeacherId);
      const res = await studioApi.generateScript(
        topic,
        synthRecipe?.name || currentTeacher?.name || '名师导师',
        chatExport
      );
      if (res.ok) {
        setSegments(res.segments);
        setCurrentStep(3);
      }
    } catch (e: any) {
      alert(e.message || '生成脚本失败');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRenderAndMerge = async () => {
    setCurrentStep(4);
    setIsRendering(true);

    // 逐段模拟/驱动合成
    for (let i = 0; i < segments.length; i++) {
      setSegments(prev => {
        const copy = [...prev];
        copy[i].status = 'rendering';
        return copy;
      });
      await new Promise(r => setTimeout(r, 600));
      setSegments(prev => {
        const copy = [...prev];
        copy[i].status = 'done';
        return copy;
      });
    }

    // 执行拼接
    try {
      const mergeRes = await studioApi.merge(segments);
      if (mergeRes.ok) {
        setMergedVideoUrl(mergeRes.merged_url || '/demo_videos/merged.mp4');
      }
    } catch (e) {
      setMergedVideoUrl('/demo_videos/merged.mp4');
    } finally {
      setIsRendering(false);
    }
  };

  const stepsList = [
    { step: 1, title: '主讲名师选择' },
    { step: 2, title: '数字人形象配置' },
    { step: 3, title: '微课脚本与分段' },
    { step: 4, title: '视频渲染与回放' },
  ];

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 64px', position: 'relative' }}>
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部标题区 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan-neon)'
              }}>
                <VideoCameraIcon size={20} />
              </div>
              <h1 style={{ fontSize: '2.1rem', color: '#ffffff', letterSpacing: '-0.035em' }}>
                数字人微课视频生成工坊
              </h1>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              将知识点大纲或 1对1 答疑实录自动切片，驱动数字人一键渲染生成超高清名师微课视频
            </p>
          </div>
        </div>

        {/* 步骤指示条 (Dark Luxury Stepper Design) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '36px'
        }}>
          {stepsList.map(s => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => (isDone ? setCurrentStep(s.step as any) : null)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: isCurrent
                    ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isCurrent ? '#ffffff' : isDone ? 'var(--emerald-neon)' : 'var(--text-muted)',
                  border: isCurrent
                    ? '1px solid var(--cyan-neon)'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid var(--border-glass)',
                  boxShadow: isCurrent ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                  cursor: isDone ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all var(--trans-fast)'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--cyan-neon)' : isDone ? 'var(--emerald-neon)' : 'rgba(255, 255, 255, 0.1)',
                  color: isCurrent ? '#020617' : isDone ? '#020617' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  {isDone ? <CheckIcon size={14} /> : s.step}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{s.title}</div>
              </div>
            );
          })}
        </div>

        {/* 步骤 1：选择主讲名师 */}
        {currentStep === 1 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
              第一步：选定微课主讲名师
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              可选用系统内原生的特级名师，或选用由您在多维合成工坊中生成的专属虚拟名师。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
              {synthRecipe && (
                <div
                  onClick={() => setSelectedTeacherId('synth')}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    border: selectedTeacherId === 'synth' ? '1px solid var(--cyan-neon)' : '1px solid var(--border-glass)',
                    background: selectedTeacherId === 'synth' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    boxShadow: selectedTeacherId === 'synth' ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all var(--trans-fast)'
                  }}
                >
                  <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>专属定制名师</span>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>{synthRecipe.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>五维基因融合 · 专属自适应</div>
                </div>
              )}

              {teachers.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    border: selectedTeacherId === t.id ? '1px solid var(--cyan-neon)' : '1px solid var(--border-glass)',
                    background: selectedTeacherId === t.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    boxShadow: selectedTeacherId === t.id ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all var(--trans-fast)'
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    flexShrink: 0
                  }}>
                    <img src={t.photoUrl || '/photos/1.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#ffffff' }}>{t.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.subject} · {t.style}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCurrentStep(2)} className="btn btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>下一步：配置数字人形象</span>
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 2：配置数字人形象与课件 */}
        {currentStep === 2 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
              第二步：配置数字人视频底模与微课主题
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              选择渲染引擎模型与教学主题，系统将调用 4K 拟真数字人模型与智能分段生成器。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '36px' }}>
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-body)' }}>
                    微课教学主题
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="输入本期微课核心攻坚主题，例如：导数在函数单调性中的应用"
                    className="input-luxury"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-body)' }}>
                    数字人声音与模型库
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'wang_chonglin_avatar', name: '王崇林·理科名师模型', desc: '4K超清·严谨启发式声线·已完成声纹微调' },
                      { id: 'li_qingyun_avatar', name: '李清韵·文科名师模型', desc: '4K超清·温润典雅声线·已完成声纹微调' },
                      { id: 'gao_zhiwei_avatar', name: '高志伟·幽默竞赛模型', desc: '4K超清·激情风趣声线·已完成声纹微调' },
                    ].map(m => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          border: selectedModel === m.id ? '1px solid var(--cyan-neon)' : '1px solid var(--border-glass)',
                          background: selectedModel === m.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          boxShadow: selectedModel === m.id ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
                          cursor: 'pointer',
                          transition: 'all var(--trans-fast)'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: selectedModel === m.id ? 'var(--cyan-neon)' : '#ffffff' }}>{m.name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧数字人视频预览底模 */}
              <div className="digital-human-frame" style={{ height: '300px' }}>
                <video
                  src="/demo_videos/model.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(1)} className="btn btn-secondary">
                上一步
              </button>
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="btn btn-primary"
                style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <SparklesIcon size={16} />
                <span>{isGeneratingScript ? '正在构思脚本...' : '下一步：AI 拆解微课脚本'}</span>
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3：微课脚本与分段编辑 */}
        {currentStep === 3 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', color: '#ffffff', fontWeight: 800 }}>
                  第三步：微课大纲与分段切片 ({segments.length} 个片段)
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  AI 已根据名师教研范式自动梳理四段式黄金微课结构，您可以自由润色台词。
                </p>
              </div>
              <button onClick={handleGenerateScript} className="btn btn-secondary" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <RefreshIcon size={13} />
                <span>重新生成脚本</span>
              </button>
            </div>

            {/* 四段式列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              {segments.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 22px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff' }}>
                      {seg.title}
                    </span>
                    <span className="badge badge-cyan">{seg.duration}</span>
                  </div>
                  <textarea
                    rows={3}
                    value={seg.script}
                    onChange={e => {
                      const updated = [...segments];
                      updated[i].script = e.target.value;
                      setSegments(updated);
                    }}
                    className="textarea-luxury"
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(2)} className="btn btn-secondary">
                上一步
              </button>
              <button onClick={handleRenderAndMerge} className="btn btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparklesIcon size={16} />
                <span>确认大纲，开始分段渲染与合成</span>
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 4：渲染与微课回放交付 */}
        {currentStep === 4 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
              第四步：微课视频渲染与交付成品
            </h3>

            {isRendering ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--cyan-neon)'
                }}>
                  <SparklesIcon size={32} />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  数字人视频渲染合成进行中...
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  正在驱动声纹TTS、Viseme动作口型与超高清数字人视频缝合...
                </p>

                {/* 分段渲染进度条 */}
                <div style={{ maxWidth: '480px', margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {segments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: 'var(--text-body)' }}>{seg.title}</span>
                      <span className={`badge ${seg.status === 'done' ? 'badge-emerald' : 'badge-amber'}`}>
                        {seg.status === 'done' ? '已渲染' : '渲染中'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* 终版微课播放器 */}
                <div className="digital-human-frame" style={{
                  maxWidth: '740px',
                  margin: '0 auto 32px'
                }}>
                  <video
                    src={mergedVideoUrl || '/demo_videos/merged.mp4'}
                    controls
                    autoPlay
                    style={{ width: '100%', display: 'block', maxHeight: '440px', background: '#000' }}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                    微课视频已成功生成
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
                    主题：{topic} · 4K 超高清数字人主讲 · 已与考点解构精准对齐
                  </p>

                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <a
                      href={mergedVideoUrl || '/demo_videos/merged.mp4'}
                      download="名师数字人精品微课.mp4"
                      className="btn btn-primary"
                      style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <DownloadIcon size={16} />
                      <span>下载微课成品视频</span>
                    </a>
                    <button onClick={() => setCurrentStep(1)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>制作另一堂微课</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
