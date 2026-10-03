import React, { useState, useEffect } from 'react';
import { studioApi, teachersApi } from '../services/api';
import { speechService } from '../services/speech';
import {
  VideoCameraIcon,
  SparklesIcon,
  RefreshIcon,
  DownloadIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CheckIcon,
} from '../components/Icons';
import { Volume2, VolumeX, Check, Award, Tv } from 'lucide-react';

interface Props {
  initialTopic?: string;
  initialScript?: string;
  synthRecipe?: any;
}

interface StudioModelItem {
  id: string;
  name: string;
  desc: string;
  videoUrl: string;
  posterUrl?: string;
  voiceTrained: boolean;
  isCustom?: boolean;
}

const TOPIC_PRESETS = [
  '导数切线与综合大题破局',
  '空间立体几何向量建系法',
  '中学化学平衡转化率计算',
  '中学物理电磁感应双棒模型',
  '学科英语长难句与语法填空突破',
  '文言文断句与古代文化常识',
];

const BACKGROUND_TEMPLATES = [
  { id: 'classroom', name: '智慧黑板教室', desc: '4K沉浸板书氛围 · 交互式智能大屏' },
  { id: 'study', name: '典雅名师书房', desc: '温润人文底蕴 · 舒适自然采光' },
  { id: 'tech_hall', name: '现代科技展厅', desc: '前沿学科视界 · 竞赛与实训展位' },
  { id: 'studio_dark', name: '黑曜极简演播厅', desc: '黑曜石纯净背景 · 聚焦公式演算' },
];

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
  const [customModels, setCustomModels] = useState<StudioModelItem[]>([]);
  const [voiceMode, setVoiceMode] = useState<'tts' | 'native'>('tts');
  const [selectedBackground, setSelectedBackground] = useState('classroom');
  const [courseDuration, setCourseDuration] = useState<'3min' | '5min'>('5min');
  const [showChatExport, setShowChatExport] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const [segments, setSegments] = useState<any[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [playingTeacherId, setPlayingTeacherId] = useState<string | null>(null);

  const getSafeAvatarUrl = (photoUrl?: string, id?: string) => {
    if (photoUrl && (photoUrl.includes('.svg') || photoUrl.includes('avatars/'))) {
      return photoUrl.startsWith('/') ? '.' + photoUrl : photoUrl;
    }
    const num = id ? parseInt(id.replace(/\D/g, ''), 10) : 1;
    const safeNum = isNaN(num) || num < 1 ? 1 : ((num - 1) % 10) + 1;
    return `./avatars/t${safeNum}.svg`;
  };

  const toggleTeacherAudio = (e: React.MouseEvent, t: any) => {
    e.stopPropagation();
    if (playingTeacherId === t.id) {
      speechService.stop();
      setPlayingTeacherId(null);
    } else {
      setPlayingTeacherId(t.id);
      speechService.speak(
        `您好，我是${t.name}，专注于${t.subject}学科深度教研。本节微课将由我为您拆解核心考点。`,
        t.voiceType || 'gentle-scholar',
        () => setPlayingTeacherId(null)
      );
    }
  };

  useEffect(() => {
    loadTeachers();
    if (initialScript) {
      setCurrentStep(3);
      handleGenerateScript();
    }
    return () => {
      speechService.stop();
    };
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
        setMergedVideoUrl(mergeRes.merged_url || './demo_videos/merged.mp4');
      }
    } catch (e) {
      setMergedVideoUrl('./demo_videos/merged.mp4');
    } finally {
      setIsRendering(false);
    }
  };

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId);
  const currentTeacherName = synthRecipe?.name || currentTeacher?.name || '王崇林 (特级教师)';

  // 动态模型列表：结合系统名师、合成名师以及用户自主上传的自定义底模
  const allModels: StudioModelItem[] = [
    ...(synthRecipe ? [{
      id: 'synth_model',
      name: `${synthRecipe.name}·专属定制模型`,
      desc: '五维教学基因融合 · 已对齐专属声纹与叙事基调',
      videoUrl: './demo_videos/merged.mp4',
      posterUrl: './demo_videos/merged_poster.jpg',
      voiceTrained: true,
      isCustom: true
    }] : []),
    ...(teachers.length > 0 ? teachers.map(t => ({
      id: `${t.id}_avatar`,
      name: `${t.name}·${t.subject}名师模型`,
      desc: `${t.style} · 4K拟真渲染 · 已对齐专属声纹`,
      videoUrl: t.dh_model_video_url || './demo_videos/merged.mp4',
      posterUrl: getSafeAvatarUrl(t.photoUrl, t.id),
      voiceTrained: true,
      isCustom: false
    })) : [
      { id: 'wang_chonglin_avatar', name: '王崇林·理科名师模型', desc: '4K超清·严谨启发式声线·已完成声纹微调', videoUrl: './demo_videos/merged.mp4', posterUrl: './avatars/t1.svg', voiceTrained: true, isCustom: false },
      { id: 'li_qingyun_avatar', name: '李清韵·文科名师模型', desc: '4K超清·温润典雅声线·已完成声纹微调', videoUrl: './demo_videos/merged.mp4', posterUrl: './avatars/t2.svg', voiceTrained: true, isCustom: false },
      { id: 'gao_zhiwei_avatar', name: '高志伟·幽默竞赛模型', desc: '4K超清·激情风趣声线·已完成声纹微调', videoUrl: './demo_videos/merged.mp4', posterUrl: './avatars/t3.svg', voiceTrained: true, isCustom: false }
    ]),
    ...customModels
  ];

  const activeModel = allModels.find(m => m.id === selectedModel);
  const currentBg = BACKGROUND_TEMPLATES.find(b => b.id === selectedBackground);
  const finalVideoSource = (activeModel?.isCustom && activeModel.videoUrl)
    ? activeModel.videoUrl
    : (mergedVideoUrl || activeModel?.videoUrl || './demo_videos/merged.mp4');

  const handleSelectTeacher = (id: string) => {
    setSelectedTeacherId(id);
    if (id === 'synth') {
      setSelectedModel('synth_model');
    } else {
      setSelectedModel(`${id}_avatar`);
    }
  };

  const handleUploadModel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newModel: StudioModelItem = {
      id: `custom_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      desc: '用户自定义底模 · 包含真实视频音轨',
      videoUrl: url,
      voiceTrained: true,
      isCustom: true
    };
    setCustomModels(prev => [newModel, ...prev]);
    setSelectedModel(newModel.id);
    setVoiceMode('native');
    setUploadNotice(`已成功载入自定义视频底模：${file.name}`);
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
                <VideoCameraIcon size={20} />
              </div>
              <h1 className="brand-display" style={{ fontSize: '2.1rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                数字人微课视频生成工坊
              </h1>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              将知识点大纲或 1对1 答疑实录自动切片，驱动数字人一键渲染生成超高清名师微课视频
            </p>
          </div>
        </div>

        {/* Final Cut Pro / Logic Pro 风格 Timeline 步骤指示条 */}
        <div className="studio-timeline-bar" style={{ marginBottom: '32px' }}>
          {stepsList.map(s => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => (isDone ? setCurrentStep(s.step as any) : null)}
                className={`studio-step-pill ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
                style={{ cursor: isDone ? 'pointer' : 'default' }}
              >
                <div className="studio-step-num">
                  {isDone ? <Check size={12} /> : s.step}
                </div>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? 'var(--text-main)' : isDone ? 'var(--text-main)' : 'var(--text-muted)'
                }}>
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* 步骤 1：选择主讲名师 */}
        {currentStep === 1 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                第一步：选定微课主讲名师
              </h3>
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Award size={12} />
                <span>4K超拟真名师库</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              可选用系统内原生的特级名师，或选用由您在多维合成工坊中生成的专属虚拟名师。点击卡片右侧试听名师原声。
            </p>

            <div className="studio-teacher-picker-grid">
              {synthRecipe && (
                <div
                  onClick={() => handleSelectTeacher('synth')}
                  className={`studio-teacher-picker-card ${selectedTeacherId === 'synth' ? 'selected' : ''}`}
                >
                  <div className="studio-teacher-avatar-box" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(147,51,234,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SparklesIcon size={24} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>专属定制</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {synthRecipe.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      五维基因融合 · 专属自适应
                    </div>
                  </div>
                  {selectedTeacherId === 'synth' && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <Check size={13} />
                    </div>
                  )}
                </div>
              )}

              {teachers.map(t => {
                const isSelected = selectedTeacherId === t.id;
                const isPlaying = playingTeacherId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTeacher(t.id)}
                    className={`studio-teacher-picker-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="studio-teacher-avatar-box">
                      <img
                        src={getSafeAvatarUrl(t.photoUrl, t.id)}
                        alt={t.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = './avatars/t1.svg'; }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          background: 'rgba(217, 119, 6, 0.14)',
                          color: '#d97706',
                          border: '1px solid rgba(217, 119, 6, 0.3)',
                          fontWeight: 700
                        }}>{t.subject}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.style}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => toggleTeacherAudio(e, t)}
                        title={isPlaying ? "停止试听" : "试听名师声纹"}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isPlaying ? 'rgba(0, 113, 227, 0.16)' : 'var(--bg-subtle)',
                          border: isPlaying ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                          color: isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                      {isSelected && (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                          <Check size={13} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>
              第二步：配置数字人底模与微课主题
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              灵活选取渲染底模与教学主题，系统将调用拟真数字人模型、智能分段生成器与多维声纹引擎。
            </p>

            {/* 隐藏的本地视频文件上传输入项 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadModel}
              accept="video/mp4,video/*"
              style={{ display: 'none' }}
            />

            {/* 自定义上传成功提示通知 */}
            {uploadNotice && (
              <div style={{
                marginBottom: '20px',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckIcon size={16} />
                  <span>{uploadNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadNotice('')}
                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  关闭
                </button>
              </div>
            )}

            {/* 一体化全宽流线型布局：不再展示右侧冗余视频框，专注高效率课程参数配置 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '36px' }}>
              {/* 模块 1：微课教学主题与快捷考点预设 */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                    微课教学攻坚主题
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChatExport(!showChatExport)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {showChatExport ? '收起 1对1 答疑实录' : '+ 导入 1对1 答疑实录切片'}
                  </button>
                </div>

                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="输入本期微课核心攻坚主题，例如：导数切线与综合大题破局"
                  className="input-luxury"
                  style={{ marginBottom: '14px', width: '100%' }}
                />

                {/* 快捷考点预设胶囊 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>热点考点快速填入：</span>
                  {TOPIC_PRESETS.map((tPreset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(tPreset)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: topic === tPreset ? 'var(--card-bg)' : 'var(--card-bg)',
                        border: topic === tPreset ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                        color: topic === tPreset ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: topic === tPreset ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tPreset}
                    </button>
                  ))}
                </div>

                {/* 展开的答疑切片输入框 */}
                {showChatExport && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      粘贴学生与名师在 1对1 辅导中的答疑文字记录，AI 引擎将自动提炼核心论点与易错题型：
                    </div>
                    <textarea
                      rows={3}
                      value={chatExport}
                      onChange={e => setChatExport(e.target.value)}
                      placeholder="例如：学生在问导数恒成立讨论参数 a 的范围时卡住，老师解释了分离参数法与端点分析法..."
                      className="textarea-luxury"
                    />
                  </div>
                )}
              </div>

              {/* 模块 2：动态数字人底模库与声音引擎选择 */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                      主讲数字人底模库 (当前共 {allModels.length} 个可用底模)
                    </label>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      已自动继承您在第一步选定的名师形象；您也可自由切换或一键上传本地 MP4 视频底模。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>+ 上传自定义视频底模 (MP4)</span>
                  </button>
                </div>

                {/* 模型网格 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '22px'
                }}>
                  {allModels.map(m => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                          background: isSelected ? 'var(--card-bg)' : 'var(--bg-surface)',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: m.isCustom ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: m.isCustom ? '#10b981' : 'var(--accent-primary)'
                          }}>
                            {m.isCustom ? '定制/上传底模' : '名师专属底模'}
                          </span>
                          {isSelected && (
                            <span style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem'
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)', marginBottom: '4px' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {m.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 双轨声音驱动模式 */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      语音驱动引擎 (Voice Engine)
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {voiceMode === 'tts'
                        ? '采用特级名师微调声线合成讲授语音，由脚本自动驱动发音与口型'
                        : '直接提取复用您上传的底模视频中讲师原声音轨，避免机械感，还原真实人声'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setVoiceMode('tts')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: voiceMode === 'tts' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        color: voiceMode === 'tts' ? '#ffffff' : 'var(--text-muted)',
                        border: '1px solid ' + (voiceMode === 'tts' ? 'var(--accent-primary)' : 'var(--border-glass)'),
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      AI 名师声纹合成 (TTS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceMode('native')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: voiceMode === 'native' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        color: voiceMode === 'native' ? '#ffffff' : 'var(--text-muted)',
                        border: '1px solid ' + (voiceMode === 'native' ? 'var(--accent-primary)' : 'var(--border-glass)'),
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      复用视频原生音轨 (Native)
                    </button>
                  </div>
                </div>
              </div>

              {/* 模块 3：虚拟背景模板与微课课时时长 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* 虚拟演播室背景选择 */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px'
                }}>
                  <label style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                    演播室虚拟背景环境
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {BACKGROUND_TEMPLATES.map(bg => {
                      const isBgActive = selectedBackground === bg.id;
                      return (
                        <div
                          key={bg.id}
                          onClick={() => setSelectedBackground(bg.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: isBgActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                            background: isBgActive ? 'var(--card-bg)' : 'var(--bg-surface)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: isBgActive ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                            {bg.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {bg.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 微课颗粒度规格 */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px'
                }}>
                  <label style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                    微课精炼时长颗粒度
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      onClick={() => setCourseDuration('3min')}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border: courseDuration === '3min' ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                        background: courseDuration === '3min' ? 'var(--card-bg)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: courseDuration === '3min' ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                        3分钟考点闪击
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        浓缩单个核心概念与易错题眼，适合快速查漏补缺
                      </div>
                    </div>
                    <div
                      onClick={() => setCourseDuration('5min')}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border: courseDuration === '5min' ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                        background: courseDuration === '5min' ? 'var(--card-bg)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: courseDuration === '5min' ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                        5分钟专题攻坚
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        完整公式推导、典例剖析与思维迁移，适合系统化巩固
                      </div>
                    </div>
                  </div>
                </div>
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
                {isGeneratingScript ? (
                  <>
                    <RefreshIcon size={16} />
                    <span>大模型正在为您解构考点生成微课脚本...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon size={16} />
                    <span>下一步：AI 拆解微课脚本</span>
                    <ArrowRightIcon size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3：微课脚本与分段编辑 */}
        {currentStep === 3 && (
          <div className="card-impeccable" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', fontWeight: 800 }}>
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-main)' }}>
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
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>
              第四步：微课视频渲染与交付成品
            </h3>

            {isRendering ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--accent-primary)'
                }}>
                  <SparklesIcon size={32} />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
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
                {/* Cinema Pro 4K Hardware Theater Frame */}
                <div className="cinema-pro-bezel">
                  {/* Top Bar with window dots, title, and 4K status */}
                  <div className="cinema-pro-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginLeft: '8px', fontWeight: 600, fontFamily: 'monospace' }}>
                        STUDIO-DISPLAY // 3840×2160 UHD // PRO-RES-422
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'tastePulse 1.8s infinite' }} />
                        MASTER 4K · 60FPS
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                        TIMECODE 00:03:42:15
                      </span>
                    </div>
                  </div>

                  {/* Viewport: Video player */}
                  <div className="cinema-pro-viewport">
                    <video
                      src={finalVideoSource}
                      controls
                      autoPlay
                      style={{ width: '100%', display: 'block', maxHeight: '520px', background: '#000' }}
                    />
                  </div>

                  {/* Footer telemetry and synchronized blackboard meta */}
                  <div className="cinema-pro-footer">
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{topic || '高中数学核心考点专题攻坚'}</span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          已交付成品
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>主讲名师：<strong style={{ color: '#e2e8f0' }}>{activeModel?.name || currentTeacherName}</strong></span>
                        <span>演播场景：<strong style={{ color: '#e2e8f0' }}>{currentBg?.name || '智慧教室'}</strong></span>
                        <span>声音音轨：<strong style={{ color: '#e2e8f0' }}>{voiceMode === 'native' ? '原声视频音轨' : 'AI特级声纹驱动'}</strong></span>
                        <span>微课制式：<strong style={{ color: '#e2e8f0' }}>{courseDuration === '3min' ? '3分钟考点闪击' : '5分钟专题攻坚'}</strong></span>
                        <span>色彩空间：<strong style={{ color: '#e2e8f0' }}>Rec.709 Wide Gamut</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <a
                        href={finalVideoSource}
                        download={`名师微课-${topic || '导数精讲'}.mp4`}
                        className="btn btn-primary"
                        style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}
                      >
                        <DownloadIcon size={15} />
                        <span>导出 4K 微课</span>
                      </a>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="btn btn-secondary"
                        style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}
                      >
                        <span>制作新微课</span>
                        <ChevronRightIcon size={14} />
                      </button>
                    </div>
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
