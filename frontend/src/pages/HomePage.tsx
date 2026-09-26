import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import {
  Sparkles,
  Zap,
  GraduationCap,
  Bot,
  Lightbulb,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Activity,
  Sliders,
  AlertCircle,
  Terminal,
  BarChart2,
  Tv,
} from 'lucide-react';
import { RadarChart5D } from '../components/RadarChart5D';
import { prefersReducedMotion, useHeroEntrance } from '../lib/gsap';
import { monitorApi } from '../services/eduApi';
import { getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; collectSegment?: 'monitor' | 'perception' | 'analysis'; teacherSection?: string; initialScores?: Record<string, number> }) => void;
}

const AXES = [
  { key: 'style', label: '教学风格', low: '先问启发', high: '严密实证' },
  { key: 'method', label: '推导方法', low: '顺藤摸瓜', high: '直击易错' },
  { key: 'strengths', label: '核心特长', low: '模型精简', high: '数形结合' },
  { key: 'personality', label: '互动温度', low: '平等亲近', high: '严谨沉稳' },
  { key: 'communication', label: '表达节奏', low: '循序渐进', high: '宏观先导' },
] as const;

type AxisKey = (typeof AXES)[number]['key'];

interface Preset {
  id: string;
  name: string;
  prompt: string;
  scores: Record<AxisKey, number>;
}

const PRESETS: Preset[] = [
  {
    id: 'socratic',
    name: '苏格拉底启发型',
    prompt: '高三理科 · 极值点偏移压轴题 · 编译苏格拉底递进反问名师...',
    scores: { style: 0.25, method: 0.35, strengths: 0.92, personality: 0.88, communication: 0.3 },
  },
  {
    id: 'olympiad',
    name: '竞赛公理破局型',
    prompt: '全国联赛 · 导数与零点放缩 · 编译竞赛公理极简证明名师...',
    scores: { style: 0.95, method: 0.92, strengths: 0.88, personality: 0.55, communication: 0.9 },
  },
  {
    id: 'gaokao',
    name: '高三压轴冲刺型',
    prompt: '一模压轴 · 圆锥曲线联立弦长 · 编译模板切片快速破法名师...',
    scores: { style: 0.75, method: 0.88, strengths: 0.45, personality: 0.72, communication: 0.82 },
  },
];

const VIBE_TOKENS = [
  { label: '极值点偏移', query: '极值点偏移为什么一定要构造对称差函数？' },
  { label: '圆锥曲线离心率', query: '椭圆与双曲线的离心率在几何统一性上怎么直观理解？' },
  { label: '导数切线放缩', query: '为什么导数大于0函数一定单调递增，逆命题为何不成立？' },
  { label: '苏格拉底反问', preset: 'socratic' },
  { label: '竞赛公理推导', preset: 'olympiad' },
];

const SAMPLE_QUESTIONS = [
  '极值点偏移为什么一定要构造对称差函数？',
  '椭圆与双曲线的离心率在几何统一性上怎么直观理解？',
  '为什么导数大于0函数一定单调递增，逆命题为何不成立？',
];

/**
 * 印刷级 KaTeX 数学公式渲染
 */
function renderKatexHtml(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return `<span class="katex-fallback">${latex}</span>`;
  }
}

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('socratic');
  const [scores, setScores] = useState<Record<AxisKey, number>>(PRESETS[0].scores);
  const [promptText, setPromptText] = useState<string>(PRESETS[0].prompt);
  const [userQuestion, setUserQuestion] = useState<string>(SAMPLE_QUESTIONS[0]);
  const [waveOffset, setWaveOffset] = useState<number>(0);
  const [eqLevels, setEqLevels] = useState<number[]>([18, 34, 22, 42, 28, 48, 32, 20]);
  const [irtTheta, setIrtTheta] = useState<number>(1.42);
  const [focusMinutes, setFocusMinutes] = useState<number>(82);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);

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

  // Waveform and EQ Animation
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.05;
      setWaveOffset(t);
      if (Math.random() < 0.25) {
        setEqLevels([
          12 + Math.random() * 24,
          20 + Math.random() * 26,
          16 + Math.random() * 28,
          24 + Math.random() * 24,
          18 + Math.random() * 30,
          28 + Math.random() * 20,
          14 + Math.random() * 22,
          10 + Math.random() * 18,
        ]);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTokenClick = (token: typeof VIBE_TOKENS[number]) => {
    if (token.preset) {
      const p = PRESETS.find((item) => item.id === token.preset);
      if (p) {
        setSelectedPreset(p.id);
        setScores(p.scores);
        setPromptText(p.prompt);
      }
    } else if (token.query) {
      setPromptText(`正在编译考点：${token.label}...`);
      setUserQuestion(token.query);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setScores(preset.scores);
    setPromptText(preset.prompt);
  };

  const handleSliderChange = (key: AxisKey, val: number) => {
    setSelectedPreset('custom');
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const learnerName = getLearnerName() || '林同学 (高三理科冲刺)';
  const weakPoint = diagnosis?.weakKnowledge?.[0] || '极值点偏移与对数均值不等式';

  // Decluttered High-Impact Cognitive Diff
  const dynamicDiffAnswer = useMemo(() => {
    const isSocratic = scores.style < 0.5;

    if (userQuestion.includes('极值点偏移') || userQuestion.includes('差函数')) {
      return {
        strategy: isSocratic ? '苏格拉底启发阶梯' : '竞赛公理深度推导',
        masterFormula: 'F(x) = f(x) - f(2x_0 - x) \\implies F\'(x) = f\'(x) + f\'(2x_0 - x)',
        masterQuote: '“构造对称差函数，将复杂的二元极值约束直接降维至一元单调性判定。”',
        baselineFormula: 'x_1 + x_2 = 2x_0 + \\Delta x \\quad [代入教案公式硬算]',
        baselineCritique: '“机械套用现成公式，没有认知台阶，变式考题依然无法举一反三。”',
        masterMetric: '认知留存率 +88%',
        baselineMetric: '遗忘率 74%',
      };
    }

    if (userQuestion.includes('离心率') || userQuestion.includes('圆锥曲线')) {
      return {
        strategy: '动态几何统一投影',
        masterFormula: '\\frac{|PF|}{d(P, L)} = e \\quad \\Longleftrightarrow \\quad r(\\theta) = \\frac{ep}{1 - e \\cos\\theta}',
        masterQuote: '“抓住圆锥截面倾角的几何直观，一式统领椭圆、双曲线与抛物线。”',
        baselineFormula: 'e = \\frac{c}{a} = \\sqrt{1 - \\frac{b^2}{a^2}} \\quad [死记公式]',
        baselineCritique: '“只背公式字母，缺乏空间投影直觉，遇到倾斜截面题目极易卡壳。”',
        masterMetric: '几何直觉 +92%',
        baselineMetric: '题型迁移率 28%',
      };
    }

    return {
      strategy: '拉格朗日中值与单调单射',
      masterFormula: 'f(x_2) - f(x_1) = f\'(\\xi)(x_2 - x_1) > 0 \\quad (x_1 < \\xi < x_2)',
      masterQuote: '“正命题由中值定理严密实证；逆命题想一想 y = x³ 在原点处的切线斜率！”',
      baselineFormula: 'f\'(x) > 0 \\iff f(x) \\uparrow \\quad [忽略零点边界条件]',
      baselineCritique: '“倒果为因，漏掉‘在任意区间不恒为0’的边界检验，高考丢分率极高。”',
      masterMetric: '避坑率 100%',
      baselineMetric: '边界漏判率 68%',
    };
  }, [scores, userQuestion]);

  return (
    <div className="page-shell" style={{ overflowX: 'hidden' }}>
      <div className="page-container">

        {/* =================================================================
            1. VIBE CODING HERO (名师即席编译工作台)
            ================================================================= */}
        <header ref={heroRef} className="apple-hero-wrap">
          {/* Spatial Holographic Badge */}
          <div className="apple-hero-badge">
            <span className="apple-status-dot apple-status-dot--primary" />
            <span style={{ letterSpacing: '0.04em' }}>VIBE CODING STUDIO · 名师即席编译中枢</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="apple-hero-title">
            今天先透彻诊断他卡在哪<br />
            <span>再决定由哪位名师来讲</span>
          </h1>

          {/* Precision Subtitle */}
          <p className="apple-hero-subtitle">
            拒绝通用 AI 的枯燥套路。基于毫米级多模态专注流与 IRT 认知穿透，即席编译重构专属特级名师解题基因。
          </p>

          {/* VIBE PROMPT COMPILER BAR */}
          <div className="vibe-prompt-wrap">
            <div className="vibe-prompt-input-row">
              <Sparkles size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <input
                type="text"
                className="vibe-prompt-input"
                placeholder="键入考点或选择提示词即席编译名师..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '9999px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  const el = document.getElementById('workbench-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Zap size={14} />
                <span>即席编译</span>
              </button>
            </div>

            {/* Quick Interactive Token Chips */}
            <div className="vibe-tokens-row">
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', alignSelf: 'center', marginRight: 4 }}>快速提示:</span>
              {VIBE_TOKENS.map((token) => (
                <button
                  key={token.label}
                  type="button"
                  className="vibe-token-chip"
                  onClick={() => handleTokenClick(token)}
                >
                  +{token.label}
                </button>
              ))}
            </div>
          </div>

          {/* DUAL-WING COMPILER STAGE (左翼神经代码流 + 右翼动态黑板画布) */}
          <div className="vibe-dual-stage">
            
            {/* Left Wing: Neural Terminal */}
            <div className="vibe-neural-terminal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={14} />
                  <span>NEURAL_COMPILER_V3</span>
                </span>
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="apple-status-dot apple-status-dot--active" />
                  <span>ACTIVE</span>
                </span>
              </div>

              <div style={{ lineHeight: 1.8, textAlign: 'left' }} className="font-mono-telemetry">
                <p style={{ color: '#64748b' }}>// TARGET: {learnerName}</p>
                <p style={{ color: '#64748b' }}>// BOTTLENECK: {weakPoint}</p>
                <p style={{ color: '#93c5fd' }}>&gt; WEIGHTS: [{Object.values(scores).map((v) => v.toFixed(2)).join(', ')}]</p>
                <p style={{ color: '#34d399' }}>&gt; SYNAPSE_AST: {selectedPreset.toUpperCase()}_Prompt_Scaffold</p>
                <p style={{ color: '#cbd5e1' }}>&gt; THEOREM_INJECT: F(x) = f(x) - f(2x₀ - x)</p>
              </div>

              <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>编译自适应度: <strong style={{ color: '#10b981' }}>99.4%</strong></span>
                <span>推理延时: <strong style={{ color: 'var(--accent-primary)' }}>12ms</strong></span>
              </div>
            </div>

            {/* Right Wing: Live Dynamic Blackboard Canvas */}
            <div className="vibe-chalkboard-stage">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59,130,246,0.25)', paddingBottom: 8, marginBottom: 10 }}>
                <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Ruler size={14} />
                  <span>动态数学黑板 (LIVE MATH CHALKBOARD)</span>
                </span>
                {/* Acoustic EQ Visualizer */}
                <div className="acoustic-eq-bar-wrap">
                  {eqLevels.map((lvl, idx) => (
                    <div key={idx} className="acoustic-eq-bar" style={{ height: `${lvl}px` }} />
                  ))}
                </div>
              </div>

              {/* Dynamic Math SVG Canvas */}
              <div style={{ flex: 1, minHeight: 140, position: 'relative' }}>
                <svg viewBox="0 0 360 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <line x1="30" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="60" y1="10" x2="60" y2="130" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  
                  {/* Origin Curve y=f(x) */}
                  <path
                    d={`M 60 110 Q 150 15 280 ${70 + Math.sin(waveOffset) * 8}`}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.5"
                  />
                  {/* Mirrored Curve y=f(2x0-x) */}
                  <path
                    d={`M 280 110 Q 190 15 60 ${70 + Math.cos(waveOffset) * 8}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  
                  {/* Tangent point */}
                  <circle cx="170" cy="45" r="5" fill="#f59e0b" />
                  <line x1="170" y1="45" x2="170" y2="120" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="170" y="134" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">x₀ (对称中心)</text>
                  <text x="260" y="60" fill="var(--accent-primary)" fontSize="11" fontFamily="monospace">y = f(x)</text>
                  <text x="70" y="60" fill="#10b981" fontSize="10" fontFamily="monospace">y = f(2x₀ - x)</text>
                </svg>
              </div>

              {/* Chalkboard KaTeX Rendered Guidance */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid var(--accent-primary)', textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>构造对称差函数：</span>
                  <span dangerouslySetInnerHTML={{ __html: renderKatexHtml('F(x) = f(x) - f(2x_0 - x)') }} />
                </div>
                <div className="font-editorial" style={{ fontSize: '13px', color: '#93c5fd', marginTop: 4 }}>
                  名师点拨：利用导数单峰性质判定单调性，化二元极为一元判定。
                </div>
              </div>

            </div>

          </div>

          {/* Quick Primary Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '14px 34px', fontSize: '15px', fontWeight: 700 }}
              onClick={() => onNavigate('collect', { collectSegment: 'monitor' })}
            >
              启动全息学情采集
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px' }}
              onClick={() => {
                const el = document.getElementById('tour-stage-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              审视 IRT 认知穿透长卷 ↓
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => {
                const el = document.getElementById('workbench-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap size={14} />
              <span>调谐 5D 认知工作台</span>
            </button>
          </div>
        </header>

        {/* =================================================================
            2. CINEMATIC MORPHING BRIDGE (视觉动态大衔接展桥)
            解决用户痛点：过度无动效、字太小、废话解释多。
            换用 28px 高对比大标题 + 流动粒子导轨 + 4 阶段联动胶囊。
            ================================================================= */}
        <div id="tour-stage-section" className="apple-cinematic-bridge">
          <div className="apple-bridge-beam">
            <div className="apple-bridge-particle" />
          </div>
          <div className="apple-bridge-kicker">COGNITIVE CLOSED LOOP · 因果渐进全息闭环</div>
          <h2 className="apple-bridge-title">
            从草稿专注阻滞，到专属名师微课生成
          </h2>
          
          {/* 4 Glowing Interactive Step Pills */}
          <div className="apple-bridge-flow-row">
            {[
              { idx: 0, label: '01 专注捕获', icon: Activity },
              { idx: 1, label: '02 潜能穿透', icon: BarChart2 },
              { idx: 2, label: '03 基因重组', icon: Sliders },
              { idx: 3, label: '04 微课演播', icon: Tv },
            ].map((step, i) => {
              const IconComp = step.icon;
              return (
                <React.Fragment key={step.idx}>
                  <button
                    type="button"
                    className={`apple-flow-pill ${activeStep === step.idx ? 'active' : ''}`}
                    onClick={() => setActiveStep(step.idx)}
                  >
                    <IconComp size={15} />
                    <span>{step.label}</span>
                  </button>
                  {i < 3 && <span className="apple-flow-arrow">➔</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            3. APPLE PRODUCT TOUR FULL STAGE (图二全新全幅沉浸展台)
            解决用户痛点：告别塑料感与横向滚轴截断，Active 阶段居中全幅展开！
            引入深色钛金仪表舱（EEG波形+视线雷达）与等宽高精度遥测数字。
            ================================================================= */}
        <section className="apple-product-stage" style={{ maxWidth: 1120, margin: '0 auto' }}>
          
          {/* Top Step Controller Bar */}
          <div className="apple-stage-step-bar">
            {[
              { idx: 0, num: 'STEP 01', title: '毫米级视觉学情感知舱', caption: '视线与脑电微震捕获' },
              { idx: 1, num: 'STEP 02', title: 'IRT 认知反应中枢', caption: '三参数 Logistic 潜能拟合' },
              { idx: 2, num: 'STEP 03', title: '5D 教学基因重组台', caption: '多维因材施教即席重构' },
              { idx: 3, num: 'STEP 04', title: '虚拟名师微课剧场', caption: '印刷级黑板动态推导' },
            ].map((step) => (
              <button
                key={step.idx}
                type="button"
                className={`apple-stage-step-btn ${activeStep === step.idx ? 'active' : ''}`}
                onClick={() => setActiveStep(step.idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className="apple-step-num">{step.num}</span>
                  {activeStep === step.idx && <span className="apple-status-dot apple-status-dot--primary" />}
                </div>
                <span className="apple-step-title">{step.title}</span>
                <span className="apple-step-caption">{step.caption}</span>
              </button>
            ))}
          </div>

          {/* Active Step Full Stage Viewport */}
          <div style={{ position: 'relative', minHeight: 380 }}>
            
            {/* STAGE 01: 毫米级学情感知舱 */}
            {activeStep === 0 && (
              <div className="apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-blue">POD 01 · 毫米级视觉学情感知舱</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>60fps 连续视线追踪</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    89.4%
                  </div>
                </div>

                {/* Dark Luxury Titanium Hardware Instrument Bay */}
                <div className="apple-instrument-bay" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center', marginBottom: 20 }}>
                  {/* Waveform Bay */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>专注微震脑电脉冲波形 (EEG PULSE)</span>
                      <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span className="apple-status-dot apple-status-dot--active" />
                        <span>沉浸推导</span>
                      </span>
                    </div>
                    <svg viewBox="0 0 300 70" style={{ width: '100%', height: 75, overflow: 'visible' }}>
                      <path
                        d={`M 0 35 Q 40 ${35 + Math.sin(waveOffset) * 20} 80 35 T 160 35 T 240 ${35 + Math.cos(waveOffset) * 18} T 300 35`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="font-mono-telemetry" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: 8 }}>
                      <span>今日专注: {focusMinutes} min</span>
                      <span>眨眼频次: 14 次/min (正常)</span>
                    </div>
                  </div>

                  {/* Pupil Tracking Reticle */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <svg viewBox="0 0 160 100" style={{ width: '100%', height: 95 }}>
                      <ellipse cx="80" cy="50" rx="64" ry="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                      <circle cx="80" cy="50" r="22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                      <circle cx={`${80 + Math.sin(waveOffset) * 8}`} cy={`${50 + Math.cos(waveOffset) * 5}`} r="8" fill="#38bdf8" />
                      <text x="80" y="96" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                        视线锁定 · 草稿第3步凝滞捕获
                      </text>
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>实时捕获阻滞时段: 18.4 分钟</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => onNavigate('collect')}>
                    <span>进入感知控制台</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 02: IRT 认知反应中枢 */}
            {activeStep === 1 && (
              <div className="apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-amber">POD 02 · 项目反应理论 (IRT) 认知反应中枢</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>三参数 Logistic 曲线拟合</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    潜能 <strong style={{ color: 'var(--accent-primary)', fontSize: '1.8rem' }}>θ = +{irtTheta.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border-glass)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-subtle)', marginBottom: 12 }}>
                    <span>P(θ) 掌握概率函数曲线</span>
                    <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span className="apple-status-dot apple-status-dot--danger" />
                      <span>锁定卡点: {weakPoint}</span>
                    </span>
                  </div>
                  <svg viewBox="0 0 460 120" style={{ width: '100%', height: 120 }}>
                    <line x1="30" y1="100" x2="440" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    <line x1="30" y1="10" x2="30" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    <path
                      d={`M 30 95 C 100 95 ${150 + irtTheta * 15} 60 ${220 + irtTheta * 15} 30 C 270 15 360 15 440 15`}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="3.5"
                    />
                    <circle cx={`${220 + irtTheta * 15}`} cy="30" r="7" fill="#ef4444" />
                    <text x={`${220 + irtTheta * 15}`} y="18" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">
                      林同学实际掌握点 (P=0.38)
                    </text>
                  </svg>
                  
                  {/* Slider to interactively adjust theta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>潜能调节:</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={irtTheta}
                      onChange={(e) => setIrtTheta(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                    />
                    <span className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      θ = {irtTheta.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>推断置信度: 94% · 根因: 对数均值对称化放缩盲区</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => onNavigate('diagnose')}>
                    <span>进入认知热力矩阵</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 03: 5D 教学重组台 */}
            {activeStep === 2 && (
              <div className="apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-emerald">POD 03 · 5D 教学基因重组台</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>拟物旋钮与声学电平</span>
                  </div>
                  <div className="preset-chip-row" style={{ margin: 0 }}>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center', marginBottom: 20 }}>
                  {/* Rotary Dials for 5 dimensions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                    {AXES.slice(0, 4).map((axis) => {
                      const deg = -90 + scores[axis.key] * 180;
                      return (
                        <div key={axis.key} style={{ textAlign: 'center' }}>
                          <div className="rotary-dial-container" style={{ margin: '0 auto 8px' }}>
                            <div className="rotary-dial-pointer" style={{ transform: `rotate(${deg}deg)` }} />
                            <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)', zIndex: 1 }}>
                              {Math.round(scores[axis.key] * 100)}%
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 650 }}>{axis.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 5D Radar Stage */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RadarChart5D scores={scores} size={200} showLabels showComposite highlightColor="var(--accent-primary)" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>因材施教适配度: 100% · 苏格拉底递进反问</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => {
                      const el = document.getElementById('workbench-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>前往参数工作台</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 04: 微课演播剧场 */}
            {activeStep === 3 && (
              <div className="apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-blue">POD 04 · 虚拟名师微课演播剧场</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>纯净黑板演算与步骤光谱</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '12px' }}>
                    +84% 思维自驱力
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(37,99,235,0.06)', borderRadius: 12, padding: 18, borderLeft: '3px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 8 }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>专属名师：启发构造对称差函数 F(x) = f(x) - f(2x₀ - x)</strong>
                      <span className="font-mono-telemetry" style={{ color: '#10b981', fontWeight: 700 }}>认知阶梯 98%</span>
                    </div>
                    <div className="derivation-spectrum-bar" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: 6 }}>
                      <span>① 发现对称中心</span>
                      <span>② 反问测试点</span>
                      <span>③ 单调单射证明</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-muted)', borderRadius: 12, padding: 18, borderLeft: '3px solid #64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 8 }}>
                      <strong style={{ color: 'var(--text-subtle)' }}>通用基准 AI：暴力联立方程硬套对数均值公式</strong>
                      <span className="font-mono-telemetry" style={{ color: '#ef4444', fontWeight: 700 }}>遗忘率极高</span>
                    </div>
                    <div style={{ height: 6, background: '#64748b', borderRadius: 3, opacity: 0.4 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-subtle)', marginTop: 6 }}>
                      <span>① 硬套公式</span>
                      <span>② 直接给答案</span>
                      <span>✕ 无思考启发</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>板书支持 LaTeX KaTeX 实时几何推导</span>
                  <button type="button" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => onNavigate('studio')}>
                    <span>前往演播厅试听微课</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Stage Navigation Arrows */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              className="reel-nav-btn"
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              style={{ opacity: activeStep === 0 ? 0.4 : 1 }}
              title="上一阶段"
              aria-label="上一阶段"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono-telemetry" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              STAGE {activeStep + 1} / 4
            </span>
            <button
              type="button"
              className="reel-nav-btn"
              onClick={() => setActiveStep((prev) => Math.min(3, prev + 1))}
              disabled={activeStep === 3}
              style={{ opacity: activeStep === 3 ? 0.4 : 1 }}
              title="下一阶段"
              aria-label="下一阶段"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* =================================================================
            4. INTERACTIVE 5D WORKBENCH (图三极简双舱工作台)
            解决用户痛点：全是字、解释过载。
            断舍离 80% 废话文字！纯粹聚焦：
            左侧极简触觉滑块 ➔ 右侧 KaTeX 公式对决 + 单句差异对比 + 核心指标。
            ================================================================= */}
        <section id="workbench-section" style={{ margin: '72px 0 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="apple-hero-badge" style={{ marginBottom: 12 }}>
              <Zap size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>INTERACTIVE COGNITIVE WORKBENCH · 5D 实时演练中枢</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', letterSpacing: '-0.035em', fontWeight: 850, color: 'var(--text-main)', marginBottom: 8 }}>
              自主调节 5D 认知基因，实时透视生成差距
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: 620, margin: '0 auto' }}>
              拖动滑块或选择经典压轴题，同屏直击名师启发支架与通用大模型的死板结论。
            </p>
          </div>

          <div className="workbench-wrap">
            
            {/* Left Column: Sliders & Controls */}
            <div className="workbench-controls apple-squircle-pod">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-main)' }}>
                  名师风格预设
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {PRESETS.find((p) => p.id === selectedPreset)?.name || '自定义'}
                </span>
              </div>

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

              {/* 5D Axis Sliders - Clean, No Text Clutter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
                {AXES.map((axis) => {
                  const val = scores[axis.key];
                  return (
                    <div key={axis.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-main)' }}>
                          {axis.label}
                        </span>
                        <span className="font-mono-telemetry" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {Math.round(val * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={val}
                        onChange={(e) => handleSliderChange(axis.key, Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Question Archetype Selectors */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 650, color: 'var(--text-main)', marginBottom: 8 }}>
                  快速求证考题：
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setUserQuestion(q)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        textAlign: 'left',
                        border: '1px solid var(--border-glass)',
                        background: userQuestion === q ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                        color: userQuestion === q ? 'var(--accent-primary)' : 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: userQuestion === q ? 650 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Clean Diff Cards - Pure Formula & Contrast */}
            <div className="workbench-diff-container">
              
              {/* Card 1: Your Tuned Master Teacher */}
              <div className="apple-clean-diff-card apple-clean-diff-card--master">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GraduationCap size={20} style={{ color: 'var(--accent-primary)' }} />
                      <strong style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>定制特级名师</strong>
                    </div>
                    <span className="badge badge-blue font-mono-telemetry" style={{ fontSize: '11px' }}>
                      {dynamicDiffAnswer.masterMetric}
                    </span>
                  </div>

                  {/* Clean KaTeX Formula Display */}
                  <div style={{ margin: '14px 0', padding: '16px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 12, border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(dynamicDiffAnswer.masterFormula, true) }} />
                  </div>

                  {/* Editorial Serif Thought Guidance */}
                  <div className="font-editorial" style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.7, background: 'rgba(37,99,235,0.05)', padding: '14px 16px', borderRadius: 10, borderLeft: '3px solid var(--accent-primary)', marginBottom: 14 }}>
                    {dynamicDiffAnswer.masterQuote}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">启发式反问</span>
                    <span className="badge badge-emerald">数形结合降维</span>
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5D 参数实时适配</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                  >
                    <span>注入名师工坊</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Standard Baseline Generic AI */}
              <div className="apple-clean-diff-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={20} style={{ color: 'var(--text-muted)' }} />
                      <strong style={{ fontSize: '16px', color: 'var(--text-muted)' }}>通用基准大模型</strong>
                    </div>
                    <span className="badge font-mono-telemetry" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px' }}>
                      {dynamicDiffAnswer.baselineMetric}
                    </span>
                  </div>

                  {/* Raw Formula Display */}
                  <div style={{ margin: '14px 0', padding: '16px 14px', background: 'var(--bg-muted)', borderRadius: 12, border: '1px dashed var(--border-glass)', textAlign: 'center', color: '#64748b' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(dynamicDiffAnswer.baselineFormula, true) }} />
                  </div>

                  {/* Contrast Callout */}
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, background: 'var(--bg-surface)', padding: '14px 16px', borderRadius: 10, borderLeft: '3px solid #94a3b8', marginBottom: 14 }}>
                    {dynamicDiffAnswer.baselineCritique}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>直接灌输</span>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>无认知台阶</span>
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>无个性化调优</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =================================================================
            5. SYSTEM CAPABILITY METRICS (全链路四维赋能矩阵)
            ================================================================= */}
        <section style={{ margin: '40px 0 60px', padding: '32px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, textAlign: 'center' }}>
            <StatItem label="专注微震捕捉精度" unit="mm" value="0.1" highlight />
            <StatItem label="IRT 认知潜能推断收敛" unit="秒" value="< 1.2" />
            <StatItem label="名师教学基因重组" unit="维空间" value="5D" highlight />
            <StatItem label="思维内驱力留存提升" unit="%" value="+42.8" />
          </div>
        </section>

      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; unit: string; value: string; highlight?: boolean }> = ({
  label,
  unit,
  value,
  highlight,
}) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
      <span
        className="stat-figure tabular-nums font-mono-telemetry"
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 800,
          color: highlight ? 'var(--accent-primary)' : 'var(--text-main)',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{unit}</span>
    </div>
    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-body)', marginTop: 4 }}>
      {label}
    </div>
  </div>
);
