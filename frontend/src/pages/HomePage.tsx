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
      desc: '解构特级名师风格、思维、题型等五大教学基因，支持动态五维全息透视。',
      Icon: GraduationCapIcon,
      actionText: '进入名师智库',
      tab: 'library',
      tag: '17+ 权威名师',
      accentColor: 'var(--accent-primary)',
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, transparent 60%)'
    },
    {
      title: '1对1 伴学 · 4K 数字人协作',
      desc: '拟真数字人与智能板书毫秒协同，支持 LaTeX 复杂公式推演与启发式答疑。',
      Icon: MessageSquareIcon,
      actionText: '发起名师辅导',
      tab: 'chat',
      tag: '毫秒级流式响应',
      accentColor: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
    },
    {
      title: '多维教学基因合成工坊',
      desc: '自由萃取名师特长并按学情组合，自研 Critic 引擎生成专属特级导师。',
      Icon: DnaIcon,
      actionText: '定制专属名师',
      tab: 'compose',
      tag: '自研融合算法',
      accentColor: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 60%)'
    },
    {
      title: '微课视频自动化渲染工坊',
      desc: '一键提炼师生答疑难点为黄金微课脚本，全自动渲染交付高清讲解视频。',
      Icon: VideoCameraIcon,
      actionText: '制作微课视频',
      tab: 'studio',
      tag: '自动化渲染缝合',
      accentColor: '#f59e0b',
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

            <h1 className="brand-display gsap-hero-title" style={{ fontSize: '3.1rem', lineHeight: '1.2', color: 'var(--text-main)', marginBottom: '20px' }}>
              汇聚特级名师教学精粹 <br />
              <span style={{
                background: 'linear-gradient(180deg, var(--text-main) 40%, var(--accent-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                以拟真数字人重构沉浸教育
              </span>
            </h1>

            <p className="gsap-hero-desc" style={{ fontSize: '1.02rem', color: 'var(--text-body)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '560px' }}>
              五维解构教学画像，自由合成专属导师。4K超清多模态协同伴学，享受特级教师深度点拨。
            </p>

            {/* 核心 CTA 按钮组 */}
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

            {/* GSAP 动态滚屏数字指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginTop: '44px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-glass)'
            }}>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countTeachers}+
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>全学科特级名师库</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countDimensions} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>维</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>教学基因深度解构</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countDataSecurity}<span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>学情数据专有沉淀</div>
              </div>
            </div>
          </div>

          {/* 右侧旗舰级数字人演播室展台 */}
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

        {/* 核心业务功能矩阵 */}
        <section style={{ marginTop: '72px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              SYSTEM CAPABILITIES
            </div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
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
                    background: 'var(--card-bg)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface)',
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
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-main)' }}>
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

        {/* 交互式五维能力雷达试验台 */}
        <section style={{
          marginTop: '72px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
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
                color: 'var(--accent-primary)',
                letterSpacing: '0.08em',
                marginBottom: '10px'
              }}>
                <SlidersIcon size={14} />
                <span>GENETIC DIMENSION MATRIX</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.03em' }}>
                交互式五维度教学基因试验台
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: '1.75', marginBottom: '26px' }}>
                自由调节教学维度参数，实时观察教学画像在五维雷达上的动态重塑：
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
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-primary)', width: '40px', textAlign: 'right' }} className="tabular-nums">
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
                highlightColor="var(--accent-primary)"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
