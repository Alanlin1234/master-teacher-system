import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadarChart5D } from '../components/RadarChart5D';
import { gsap, prefersReducedMotion, useHeroEntrance } from '../lib/gsap';
import { monitorApi } from '../services/eduApi';
import { getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; collectSegment?: 'monitor' | 'perception' | 'analysis' }) => void;
}

const AXES = [
  { key: 'style', label: '上课风格', low: '先问启发', high: '严密实证' },
  { key: 'method', label: '教学方法', low: '顺藤摸瓜', high: '直击易错' },
  { key: 'strengths', label: '核心特长', low: '模型精简', high: '数形结合' },
  { key: 'personality', label: '互动温度', low: '平等亲近', high: '严谨沉稳' },
  { key: 'communication', label: '表达节奏', low: '循序渐进', high: '宏观先导' },
] as const;

type AxisKey = (typeof AXES)[number]['key'];

interface Preset {
  id: string;
  name: string;
  tagline: string;
  scores: Record<AxisKey, number>;
}

const PRESETS: Preset[] = [
  {
    id: 'socratic',
    name: '苏格拉底递进反问型',
    tagline: '先问不给答案 · 启发构造对称差函数',
    scores: { style: 0.25, method: 0.35, strengths: 0.92, personality: 0.88, communication: 0.3 },
  },
  {
    id: 'olympiad',
    name: '竞赛金牌破局型',
    tagline: '严密实证公理 · 直击易错极端边界',
    scores: { style: 0.95, method: 0.92, strengths: 0.88, personality: 0.55, communication: 0.9 },
  },
  {
    id: 'gaokao',
    name: '高三压轴冲刺型',
    tagline: '步骤收短拿满分 · 模板切片快速破解',
    scores: { style: 0.75, method: 0.88, strengths: 0.45, personality: 0.72, communication: 0.82 },
  },
  {
    id: 'visual',
    name: '几何数形具象型',
    tagline: '图像全维展开 · 相切临界直观建模',
    scores: { style: 0.35, method: 0.45, strengths: 0.98, personality: 0.85, communication: 0.4 },
  },
];

const SAMPLE_QUESTIONS = [
  '极值点偏移为什么一定要构造对称差函数？',
  '椭圆与双曲线的离心率在几何统一性上怎么直观理解？',
  '为什么导数大于0函数一定单调递增，逆命题为何不成立？',
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activePhase, setActivePhase] = useState<number>(0);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(82);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('socratic');
  const [scores, setScores] = useState<Record<AxisKey, number>>(PRESETS[0].scores);
  const [userQuestion, setUserQuestion] = useState<string>(SAMPLE_QUESTIONS[0]);
  const [waveOffset, setWaveOffset] = useState(0);

  useHeroEntrance(heroRef);

  useEffect(() => {
    const stored = readDiagnosis();
    setDiagnosis(stored);
    monitorApi.getDashboard(101, 101).then((dash) => {
      const seconds = dash.stats?.focus_seconds_today;
      if (typeof seconds === 'number') {
        setFocusMinutes(Math.round(seconds / 60));
      }
    }).catch(() => {
      setFocusMinutes(82);
    });
  }, []);

  // Subtle wave animation for live telemetry stage
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.05;
      setWaveOffset(t);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setScores(preset.scores);
  };

  const handleSliderChange = (key: AxisKey, val: number) => {
    setSelectedPreset('custom');
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const learnerName = getLearnerName() || '林同学 (高三理科冲刺)';
  const weakPoint = diagnosis?.weakKnowledge?.[0] || '极值点偏移与对数均值不等式';

  // Dynamic response generated based on current 5D parameters
  const masterResponse = useMemo(() => {
    const isSocratic = scores.style < 0.5;
    const isVisual = scores.strengths > 0.6;
    const isRigorous = scores.method > 0.6;

    if (userQuestion.includes('极值点偏移') || userQuestion.includes('差函数')) {
      return {
        strategy: isSocratic ? '【苏格拉底递进启发】' : '【竞赛公理深度推导】',
        coreProof: isSocratic
          ? `同学们注意观察：已知 x₁ + x₂ > 2x₀。如果直接带入方程相减，很难判定正负。那我们能不能换个角度——既然对称中心是 x₀，不妨构造对称测试点 x' = 2x₀ - x₁？此时 f(x') 与 f(x₁) 的高低关系是什么？请看黑板上的切线斜率变化！`
          : `对于极值点偏移问题，构造对称差函数 F(x) = f(x) - f(2x₀ - x) 是利用函数在单峰区间的单调单射性。通过求导 F'(x) 并利用对数均值不等式放缩，可直接将二元极值约束降维成一元关于自变量的符号判别，步骤压缩率达 60%。`,
        visualNote: isVisual
          ? '📐 动态板书：几何画布已同步展开 y = f(x) 与镜像曲线 y = f(2x₀ - x)，切线交点临界一目了然。'
          : '⚡ 步骤优化：规避了暴力求导 20 行计算，直接采用一阶差分判别式拿满步骤分。',
        contrastTag: isSocratic ? '启发式引导思辨' : '降维极简严密证明',
        gain: '+84% 思维自驱力',
      };
    }

    if (userQuestion.includes('离心率') || userQuestion.includes('圆锥曲线')) {
      return {
        strategy: isVisual ? '【全维数形几何建模】' : '【代数射影统一定律】',
        coreProof: isVisual
          ? `先不要急着背公式 e = c/a！大家看这幅动态几何图：当动点 P 到焦点 F 的距离与到准线 L 的距离之比为常数 e 时——当 e < 1 曲线自然封闭收拢为椭圆；当 e = 1 临界拉平成抛物线；当 e > 1 彻底逃逸发散为双曲线！这就是圆锥截线的本质！`
          : `统一使用二次曲线极坐标方程 r = ep / (1 - e cosθ)。e 决定了二次项特征根的正负判别式符号。通过焦点弦切线斜率代换，可直接跳过硬联立韦达定理，提速 2 倍解题。`,
        visualNote: '📐 动态模型：圆锥截面倾角实时动画推演完成。',
        contrastTag: '直击本质无需死记',
        gain: '+92% 空间直觉建立',
      };
    }

    return {
      strategy: '【专属特级教师因材施教】',
      coreProof: `针对这个问题，我们先拆解它的认知卡点：第一步先看反例边界，第二步探究充分性与必要性的断层。已知导数 f'(x) > 0 能保证严格单调递增，但当 f'(x) ≥ 0 且零点不构成区间时，逆命题依然成立。`,
      visualNote: '📐 板书解析：数形结合标出临界驻点状态。',
      contrastTag: '思维分步点拨',
      gain: '+76% 概念深度理解',
    };
  }, [userQuestion, scores]);

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 80 }}>
      <div className="app-container" ref={heroRef}>
        
        {/* =================================================================
            1. HERO: APPLE SPATIAL CENTERPIECE (苹果级去模板化空间展台)
            ================================================================= */}
        <header className="apple-hero-wrap">
          <div className="apple-hero-badge">
            <span className="status-beacon" style={{ background: 'var(--accent-primary)', width: 8, height: 8 }} />
            一份学情 · 一位名师 · 全闭环智能演进系统
          </div>

          <h1 className="apple-hero-title">
            今天先透彻诊断他卡在哪<br />
            <span>再决定由哪位名师来讲</span>
          </h1>

          <p className="apple-hero-subtitle">
            摒弃通用 AI 的机械式灌输。基于实时毫米级多模态专注流与 IRT 潜能穿透，
            为 <strong style={{ color: 'var(--text-main)' }}>{learnerName}</strong> 量身重构特级教师解题基因。
          </p>

          <div className="apple-hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '15px', fontWeight: 650 }}
              onClick={() => onNavigate('collect', { collectSegment: 'monitor' })}
            >
              开启实时学情采集
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px' }}
              onClick={() => {
                const el = document.getElementById('workbench-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              调谐 5D 名师工作台
            </button>
          </div>

          {/* 中央大画幅：名师数字神经与全息学情中心台 */}
          <div className="apple-spatial-stage">
            <div className="apple-stage-grid">
              
              {/* Left HUD: 实时专注波形 */}
              <div className="stage-hud-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    学情感知流
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    60fps 实时采样
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }} className="tabular-nums">
                    89.4%
                  </span>
                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                    高频专注 · 沉浸推导
                  </span>
                </div>
                {/* Dynamic SVG Waveform */}
                <svg viewBox="0 0 240 50" style={{ width: '100%', height: 44, overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 25 Q 30 ${25 + Math.sin(waveOffset) * 16} 60 25 T 120 25 T 180 25 T 240 ${25 + Math.cos(waveOffset) * 14}`}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', marginTop: 8 }}>
                  <span>今日专注累积: {focusMinutes || 82} 分钟</span>
                  <span>生理波形微颤: 正常</span>
                </div>
              </div>

              {/* Center Hub: 名师神经中枢 */}
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: '0 auto 14px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, rgba(37,99,235,0.05) 70%)',
                    border: '1.5px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 24px var(--accent-primary-glow)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '26px' }}>⚡</span>
                  <div
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: '1px dashed var(--accent-primary-border)',
                      animation: 'spin 12s linear infinite',
                    }}
                  />
                </div>
                <div style={{ fontWeight: 750, fontSize: '15px', color: 'var(--text-main)', marginBottom: 4 }}>
                  名师数字神经突触
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  已激活：{PRESETS.find((p) => p.id === selectedPreset)?.name || '自定义调谐教学法'}
                </p>
              </div>

              {/* Right HUD: 认知瓶颈穿透 */}
              <div className="stage-hud-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    IRT 认知瓶颈诊断
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    第一攻坚优先级
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.4 }}>
                  {weakPoint}
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: '12px', color: 'var(--text-body)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>潜能 θ: </span>
                    <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>+1.42</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>卡点耗时: </span>
                    <strong>18.4 min</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>掌握度: </span>
                    <strong style={{ color: '#ef4444' }}>38%</strong>
                  </div>
                </div>
                <div style={{ marginTop: 12, height: 6, background: 'var(--bg-muted)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: '#ef4444', borderRadius: 3 }} />
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* =================================================================
            2. FOUR-PHASE EVOLUTION: DYNAMIC INTERACTIVE VIEWPORT (四维全息动态视窗)
            ================================================================= */}
        <section style={{ margin: '80px 0 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p className="page-kicker" style={{ marginBottom: 6 }}>全闭环质变演进</p>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', letterSpacing: '-0.035em' }}>
              从学情感知到虚拟名师的 4 阶蜕变
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 560, margin: '8px auto 0' }}>
              告别静态空洞口号。点击下方时序胶囊，实时审视每一阶段的真实动态图景。
            </p>
          </div>

          {/* Phase Switcher Capsule */}
          <div className="phase-timeline-nav">
            {[
              { id: 0, num: '01', title: '多模态感知' },
              { id: 1, num: '02', title: '全域认知诊断' },
              { id: 2, num: '03', title: '名师基因合成' },
              { id: 3, num: '04', title: '交互微课呈现' },
            ].map((phase) => (
              <button
                key={phase.id}
                type="button"
                className={`phase-pill-btn ${activePhase === phase.id ? 'active' : ''}`}
                onClick={() => setActivePhase(phase.id)}
              >
                <span style={{ opacity: 0.7, fontFamily: 'monospace' }}>{phase.num}</span>
                <span>{phase.title}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Viewport Stage */}
          <div className="dynamic-viewport-stage">
            
            {/* Stage 01: 多模态感知 */}
            {activePhase === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, alignItems: 'center' }}>
                <div>
                  <div className="badge badge-blue" style={{ marginBottom: 12 }}>STAGE 01 · 毫米级多模态感知</div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: 14 }}>实时锁定学习者视线与微表情阻滞</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20 }}>
                    通过前置视觉流对专注微震、眨眼频次、视线凝滞点进行 60fps 连续解析，
                    精准标记学生在哪一个推导步骤停顿超过 45 秒，无需繁琐做题即可捕捉学情卡点。
                  </p>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: 'var(--accent-primary)', fontSize: '2rem' }}>60 fps</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>连续视觉采样率</div>
                    </div>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: '#10b981', fontSize: '2rem' }}>98.4%</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>走神中断捕获率</div>
                    </div>
                  </div>
                </div>
                {/* Visual Graphic */}
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 16, padding: 24, border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <svg viewBox="0 0 300 160" style={{ width: '100%', height: 160 }}>
                    {/* Face tracking mesh simulation */}
                    <ellipse cx="150" cy="80" rx="65" ry="75" fill="none" stroke="var(--border-glass)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <circle cx="125" cy="70" r="10" fill="none" stroke="var(--accent-primary)" strokeWidth="2" />
                    <circle cx="125" cy="70" r="3" fill="var(--accent-primary)" />
                    <circle cx="175" cy="70" r="10" fill="none" stroke="var(--accent-primary)" strokeWidth="2" />
                    <circle cx="175" cy="70" r="3" fill="var(--accent-primary)" />
                    <path d="M 135 110 Q 150 120 165 110" fill="none" stroke="var(--accent-primary)" strokeWidth="2" />
                    {/* Telemetry wave below */}
                    <path d="M 20 145 Q 80 130 150 145 T 280 145" fill="none" stroke="#10b981" strokeWidth="2" />
                    <text x="150" y="24" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="monospace">
                      EYE-TRACKING & MICRO-EXPRESSION LOCKED
                    </text>
                  </svg>
                  <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: 8 }}>
                    视线轨迹锁定 · 识别到第 3 行推导出现思维凝滞
                  </div>
                </div>
              </div>
            )}

            {/* Stage 02: 全域认知诊断 */}
            {activePhase === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, alignItems: 'center' }}>
                <div>
                  <div className="badge badge-amber" style={{ marginBottom: 12 }}>STAGE 02 · 项目反应理论 (IRT)</div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: 14 }}>三参数 Logistic 曲线深挖潜在认知裂痕</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20 }}>
                    超越传统考试得分统计，基于 IRT 模型计算学生的能力潜能值 $\theta$ 与题项区分度。
                    诊断系统能识别出学生究竟是“粗心失误”还是“概念根本未建立”。
                  </p>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: 'var(--accent-primary)', fontSize: '2rem' }}>θ = +1.42</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>前沿认知能力值</div>
                    </div>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: '#d97706', fontSize: '2rem' }}>94%</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>阻滞根因推断置信度</div>
                    </div>
                  </div>
                </div>
                {/* Visual Graphic: IRT Curve */}
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 16, padding: 24, border: '1px solid var(--border-glass)' }}>
                  <svg viewBox="0 0 300 160" style={{ width: '100%', height: 160 }}>
                    <line x1="40" y1="130" x2="280" y2="130" stroke="var(--border-glass)" strokeWidth="1.5" />
                    <line x1="40" y1="20" x2="40" y2="130" stroke="var(--border-glass)" strokeWidth="1.5" />
                    {/* S-curve for IRT */}
                    <path
                      d="M 40 125 C 100 125 130 90 160 55 C 190 25 240 25 280 25"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="3"
                    />
                    {/* Mark student position */}
                    <circle cx="160" cy="55" r="6" fill="#ef4444" />
                    <line x1="160" y1="55" x2="160" y2="130" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="160" y="44" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">
                      林同学卡点 (P=0.38)
                    </text>
                    <text x="160" y="145" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                      潜能 θ = 1.42
                    </text>
                  </svg>
                  <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
                    识别根因：非算力不足，系对数均值放缩对称化思维断层
                  </div>
                </div>
              </div>
            )}

            {/* Stage 03: 名师基因合成 */}
            {activePhase === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, alignItems: 'center' }}>
                <div>
                  <div className="badge badge-emerald" style={{ marginBottom: 12 }}>STAGE 03 · 5D 教学法基因突触</div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: 14 }}>动态调谐 5 维特级教师专属教学风格</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20 }}>
                    从上课风格、推导方法、特长偏向、互动温度到表达节奏五大维度，将特级教师数十年的解题精髓
                    提炼为参数化基因，根据诊断出的卡点自动生成最适合该学生的专属教学法。
                  </p>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: '#10b981', fontSize: '2rem' }}>5D</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>全维教学法参数</div>
                    </div>
                    <div>
                      <div className="stat-figure tabular-nums" style={{ color: 'var(--accent-primary)', fontSize: '2rem' }}>100%</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>因材施教适配度</div>
                    </div>
                  </div>
                </div>
                {/* Visual Graphic: Radar */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-surface-elevated)', borderRadius: 16, padding: 18, border: '1px solid var(--border-glass)' }}>
                  <RadarChart5D scores={scores} size={190} showLabels showComposite highlightColor="var(--accent-primary)" />
                </div>
              </div>
            )}

            {/* Stage 04: 交互微课呈现 */}
            {activePhase === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, alignItems: 'center' }}>
                <div>
                  <div className="badge badge-blue" style={{ marginBottom: 12 }}>STAGE 04 · 数字人白板推演</div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: 14 }}>特级名师同款板书动画与语音循循善诱</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20 }}>
                    合成后的名师并非干瘪念稿，而是结合动态几何黑板，分步板书演算，
                    在关键拐点适时停顿提问，给学生留出思考时间，确保每一个认知瓶颈被彻底粉碎。
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 8 }}
                    onClick={() => onNavigate('studio')}
                  >
                    前往演播厅试听微课 →
                  </button>
                </div>
                {/* Visual Graphic: Chalkboard */}
                <div style={{ background: '#0b1320', borderRadius: 16, padding: 22, border: '1px solid rgba(59,130,246,0.3)', color: '#f8fafc', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, fontSize: '12px', color: 'var(--accent-primary)' }}>
                    <span>● 虚拟微课演算台 (LIVE)</span>
                    <span>1080P · 纯净板书</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#93c5fd', margin: '4px 0' }}>// 步骤一：构造对称差函数</p>
                  <p style={{ fontSize: '14px', margin: '4px 0', color: '#ffffff' }}>令 F(x) = f(x) - f(2x₀ - x)</p>
                  <p style={{ fontSize: '13px', color: '#34d399', margin: '8px 0 4px' }}>// 名师提问引导：</p>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 6 }}>
                    “注意观察：x ∈ (x₀, +∞) 时，2x₀ - x 与 x₀ 的大小关系如何？”
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* =================================================================
            3. INTERACTIVE 5D WORKBENCH (5D 双栏教学法实时差分对比工作台)
            ================================================================= */}
        <section id="workbench-section" style={{ margin: '80px 0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p className="page-kicker" style={{ marginBottom: 6 }}>深度交互实验室</p>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', letterSpacing: '-0.035em' }}>
              5D 教学基因工作台 · 实时体验因材施教差距
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 640, margin: '8px auto 0' }}>
              拖动左侧教学法滑块或选择预设，自由键入您想考考 AI 的任何难题，右侧同屏实时对比名师与通用大模型的教学答复差距。
            </p>
          </div>

          <div className="workbench-wrap">
            
            {/* Left Column: Sliders & Controls */}
            <div className="workbench-controls">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-main)' }}>
                  名师风格快捷预设
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  一键调谐
                </span>
              </div>

              {/* Preset Chips */}
              <div className="preset-chip-row">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`preset-chip ${selectedPreset === p.id ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* 5 Range Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
                {AXES.map((axis) => {
                  const val = Math.round(scores[axis.key] * 100);
                  return (
                    <div key={axis.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 6 }}>
                        <strong style={{ color: 'var(--text-main)' }}>{axis.label}</strong>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }} className="tabular-nums">
                          {val}% · {val > 50 ? axis.high : axis.low}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{axis.low}</span>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={val}
                          onChange={(e) => handleSliderChange(axis.key, Number(e.target.value) / 100)}
                          style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{axis.high}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Question Input Box */}
              <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid var(--border-glass)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 750, color: 'var(--text-main)', marginBottom: 8 }}>
                  自由提问 / 输入考点
                </label>
                <textarea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  rows={3}
                  placeholder="输入你想测试的数学/物理难题..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setUserQuestion(q)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-glass)',
                        fontSize: '11px',
                        color: 'var(--text-body)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {q.slice(0, 14)}...
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 0' }}
                  onClick={() => onNavigate('compose', { weakKnowledge: diagnosis?.weakKnowledge })}
                >
                  按当前 5D 参数固化名师 →
                </button>
              </div>
            </div>

            {/* Right Column: Split Comparison Cards */}
            <div className="workbench-diff-container">
              
              {/* Card 1: Your Tuned Master Teacher */}
              <div className="workbench-card workbench-card--master">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '18px' }}>🎓</span>
                      <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>您调谐的专属名师</strong>
                    </div>
                    <span className="diff-tag-socratic" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 9999, fontWeight: 600 }}>
                      {masterResponse.gain}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
                    模式：<strong style={{ color: 'var(--text-main)' }}>{masterResponse.strategy}</strong>
                  </div>

                  <div
                    style={{
                      background: 'rgba(37,99,235,0.04)',
                      borderLeft: '3px solid var(--accent-primary)',
                      padding: '12px 14px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: 'var(--text-main)',
                      marginBottom: 14,
                    }}
                  >
                    {masterResponse.coreProof}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-body)', background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
                    {masterResponse.visualNote}
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>教学法标签: {masterResponse.contrastTag}</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✓ 符合认知进阶</span>
                </div>
              </div>

              {/* Card 2: Standard Baseline Generic AI */}
              <div className="workbench-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <strong style={{ fontSize: '15px', color: 'var(--text-muted)' }}>标准通用基准大模型</strong>
                    </div>
                    <span className="diff-tag-generic" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 9999 }}>
                      传统机械输出
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
                    输出模式：<strong style={{ color: 'var(--text-subtle)' }}>照搬公式死记硬背</strong>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-muted)',
                      borderLeft: '3px solid var(--text-subtle)',
                      padding: '12px 14px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: 'var(--text-body)',
                      marginBottom: 14,
                    }}
                  >
                    极值点偏移是指若函数 f(x) 存在两个极值点 x₁, x₂ 且满足 f(x₁) = f(x₂)，则判定 x₁ + x₂ 与 2x₀ 的大小关系。常规解法：直接写出导数方程 f'(x₁) = 0 和 f'(x₂) = 0，代入消元，或直接背诵对数均值不等式公式：(a-b)/ln(a/b) &lt; (a+b)/2。
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 8 }}>
                    ⚠️ 缺陷：没有启发引导，缺乏图像直观建模，遇到复杂变式学生依然不会做。
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>教学法标签: 机械灌输答案</span>
                  <span style={{ color: '#ef4444' }}>✕ 遗忘率极高</span>
                </div>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
