import React, { useState, useRef } from 'react';
import { TeacherDigitalHuman } from '../components/TeacherDigitalHuman';
import { RadarChart5D } from '../components/RadarChart5D';
import { speechService } from '../services/speech';
import {
  GraduationCapIcon,
  MessageSquareIcon,
  DnaIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  SparklesIcon,
  SlidersIcon,
  VolumeIcon,
} from '../components/Icons';
import { useHeroEntrance, useCountUp } from '../lib/gsap';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const [demoState, setDemoState] = useState<'idle' | 'speaking'>('idle');
  const [caption, setCaption] = useState('');
  const [forceUnmute, setForceUnmute] = useState(false);
  const [interactiveScores, setInteractiveScores] = useState({
    style: 0.94,
    personality: 0.88,
    strengths: 0.96,
    method: 0.92,
    communication: 0.86,
  });

  const heroContainerRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Timeline & Dynamic Counters
  useHeroEntrance(heroContainerRef);
  const countTeachers = useCountUp(17, 1.5);
  const countDimensions = useCountUp(5, 1.2);
  const countDataSecurity = useCountUp(100, 1.6);

  const handleTryAudio = () => {
    // 停止任何合成语音，直接开启 MP4 视频原声播放与字幕协同
    speechService.stop();
    const transcriptText = "《德意志意识形态》是唯物史观第一次被完整、系统地写出来的著作。这节课沿着原著原文，把核心原理拆开，再对照当代实践。";
    setCaption(transcriptText);
    setDemoState('speaking');
    setForceUnmute(true);
  };

  const featureCards = [
    {
      title: '名师智库 · 五维全息画像',
      desc: '收录各学科特级名师，深度解构上课风格、思维方法、题型剖析等五大教学基因，支持纯SVG夜间荧光雷达透视。',
      Icon: GraduationCapIcon,
      actionText: '进入名师智库',
      tab: 'library',
      tag: '17+ 权威名师',
      accentColor: 'var(--cyan-neon)',
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, transparent 60%)'
    },
    {
      title: '1对1 伴学 · 4K 数字人协作',
      desc: '4K超清数字人与智能板书毫秒级协同，支持 LaTeX 复杂公式渲染、双向实时语音拾音与苏格拉底启发式答疑。',
      Icon: MessageSquareIcon,
      actionText: '发起名师辅导',
      tab: 'chat',
      tag: '毫秒级流式响应',
      accentColor: '#60a5fa',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
    },
    {
      title: '多维教学基因合成工坊',
      desc: '打破名师物理局限，自由萃取名师基因按学情组合，经自研 AI Critic 一致性审查引擎生成专属虚拟名师。',
      Icon: DnaIcon,
      actionText: '定制专属名师',
      tab: 'compose',
      tag: '自研融合算法',
      accentColor: '#34d399',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 60%)'
    },
    {
      title: '微课视频自动化渲染工坊',
      desc: '一键将师生答疑对话或核心难点切片转化为四段式黄金微课脚本，驱动超清数字人全自动渲染输出交付。',
      Icon: VideoCameraIcon,
      actionText: '制作微课视频',
      tab: 'studio',
      tag: '自动化渲染缝合',
      accentColor: '#fbbf24',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 60%)'
    },
  ];

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '88px' }}>
      <div className="app-container" ref={heroContainerRef}>
        {/* Hardware-Grade Hero Stage (Linear / Apple Dark Luxury) */}
        <section className="hero-stage-grid">
          {/* 左侧宏大叙事与行动中枢 */}
          <div>
            {/* 精准学术名校级 Kicker */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 10px var(--accent-primary-glow)'
              }} />
              <span>ACADEMIC INTELLIGENCE · 特级名师教研体系</span>
            </div>

            <h1 className="brand-display gsap-hero-title" style={{ fontSize: '3.3rem', lineHeight: '1.2', color: '#ffffff', marginBottom: '22px' }}>
              汇聚特级名师教学精粹 <br />
              <span style={{
                background: 'linear-gradient(180deg, #ffffff 40%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                以拟真数字人重构沉浸教育
              </span>
            </h1>

            <p className="gsap-hero-desc" style={{ fontSize: '1.02rem', color: 'var(--text-body)', lineHeight: '1.7', marginBottom: '34px', maxWidth: '560px' }}>
              五维解构名师教学画像，自由重组教学基因合成专属导师；
              超高清数字人多模态协同伴学，让每一位学习者都享有专属特级教师的深度点拨。
            </p>

            {/* 核心 CTA 按钮组 (清晰克制，去除多余按钮) */}
            <div className="gsap-hero-cta" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => onNavigate('library')}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.94rem' }}
              >
                <span>探索名师智库</span>
                <ArrowRightIcon size={16} />
              </button>
              <button
                onClick={() => onNavigate('compose')}
                className="btn btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.94rem' }}
              >
                <DnaIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>定制专属名师</span>
              </button>
              <button
                onClick={handleTryAudio}
                className="btn btn-ghost"
                style={{ padding: '10px 18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}
                title="试听上传 MP4 中的特级教师真实原声"
              >
                <VolumeIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>试听名师原声</span>
              </button>
            </div>

            {/* GSAP 动态滚屏数字指标 (纯净统一，去除杂色混用) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginTop: '48px',
              paddingTop: '28px',
              borderTop: '1px solid var(--border-glass)'
            }}>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
                  {countTeachers}+
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>全学科特级名师库</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
                  {countDimensions} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>维</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>教学基因深度解构</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
                  {countDataSecurity}<span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>学情数据专有私域沉淀</div>
              </div>
            </div>
          </div>

          {/* 右侧旗舰级数字人演播室展台 (GSAP 浮动舞台) */}
          <div className="gsap-hero-stage">
            <TeacherDigitalHuman
              teacherName="王崇林 (特级教师)"
              subtitle="全国竞赛金牌导师 · 启发式逻辑推演"
              avatarState={demoState}
              captionText={caption}
              forceUnmute={forceUnmute}
              modelVideoUrl="./demo_videos/merged.mp4"
              posterUrl="./demo_videos/merged_poster.jpg"
              onToggleVoice={() => {
                if (demoState === 'speaking' || forceUnmute) {
                  speechService.stop();
                  setDemoState('idle');
                  setForceUnmute(false);
                  setCaption('');
                } else {
                  handleTryAudio();
                }
              }}
            />
          </div>
        </section>

        {/* 核心业务功能矩阵 (Magnetic Bento Grid with Zero Emojis) */}
        <section style={{ marginTop: '72px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--cyan-neon)',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              SYSTEM CAPABILITIES
            </div>
            <h2 style={{ fontSize: '2rem', color: '#ffffff', letterSpacing: '-0.03em' }}>
              全流程教学业务闭环
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              从名师智库解构、1对1伴学，到智能多维合成与微课视频输出
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {featureCards.map(c => {
              const CardIcon = c.Icon;
              return (
                <div
                  key={c.tab}
                  className="card-impeccable"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `var(--bg-surface) ${c.gradient}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: c.accentColor
                    }}>
                      <CardIcon size={22} />
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{c.tag}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ffffff' }}>
                    {c.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: '1.65', marginBottom: '28px', flex: 1 }}>
                    {c.desc}
                  </p>
                  <button
                    onClick={() => onNavigate(c.tab)}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.86rem', justifyContent: 'space-between', padding: '9px 18px' }}
                  >
                    <span>{c.actionText}</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 交互式五维能力雷达试验台 (Interactive 5D Radar Lab) */}
        <section style={{
          marginTop: '76px',
          background: 'linear-gradient(180deg, #0d1527 0%, #070b14 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '44px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--cyan-neon)',
                letterSpacing: '0.08em',
                marginBottom: '10px'
              }}>
                <SlidersIcon size={14} />
                <span>GENETIC DIMENSION MATRIX</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', color: '#ffffff', marginBottom: '14px', letterSpacing: '-0.03em' }}>
                交互式五维度教学基因试验台
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: '1.75', marginBottom: '28px' }}>
                系统将特级名师教学模式解构为五大相互解耦的核心基因。
                尝试拖动下方滑块，实时观察名师画像与思维特征在右侧荧光雷达上的动态重塑：
              </p>

              {/* 交互滑块组 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'style', label: '上课风格 (启发引导 vs 严密推理)' },
                  { key: 'method', label: '教学方法 (苏格拉底追问 vs 典例变式)' },
                  { key: 'strengths', label: '核心优点 (数形结合 vs 综合建模)' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', width: '220px' }}>
                      {item.label}
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={Math.round((interactiveScores as any)[item.key] * 100)}
                      onChange={e => {
                        const val = Number(e.target.value) / 100;
                        setInteractiveScores(prev => ({ ...prev, [item.key]: val }));
                      }}
                      style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--cyan-neon)', width: '40px', textAlign: 'right' }} className="tabular-nums">
                      {Math.round((interactiveScores as any)[item.key] * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧荧光动态雷达 */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart5D
                scores={interactiveScores}
                size={290}
                showLabels={true}
                highlightColor="#38bdf8"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
