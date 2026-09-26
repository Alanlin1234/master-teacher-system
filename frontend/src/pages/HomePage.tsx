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
  BarChart2,
  Tv,
  Search,
  BookOpen,
  CheckCircle2,
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
  const [customInputText, setCustomInputText] = useState<string>('');
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

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setScores(preset.scores);
    setPromptText(preset.prompt);
  };

  const handleSliderChange = (key: AxisKey, val: number) => {
    setSelectedPreset('custom');
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleQuestionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customInputText.trim()) {
      setUserQuestion(customInputText.trim());
    }
  };

  const learnerName = getLearnerName() || '林同学 (高三理科冲刺)';
  const weakPoint = diagnosis?.weakKnowledge?.[0] || '极值点偏移与对数均值不等式';

  // Decluttered High-Impact Cognitive Diff
  const dynamicDiffAnswer = useMemo(() => {
    const isSocratic = scores.style < 0.5;

    if (userQuestion.includes('极值点偏移') || userQuestion.includes('差函数') || userQuestion.includes('极值')) {
      return {
        strategy: isSocratic ? '苏格拉底启发阶梯' : '竞赛公理深度推导',
        masterFormula: "F(x) = f(x) - f(2x_0 - x) \\implies F'(x) = f'(x) + f'(2x_0 - x)",
        masterQuote: '“构造对称差函数，将复杂的二元极值约束直接降维至一元单调性判定。”',
        baselineFormula: 'x_1 + x_2 = 2x_0 + \\Delta x \\quad [代入教案公式硬算]',
        baselineCritique: '“机械套用现成公式，没有认知台阶，变式考题依然无法举一反三。”',
        masterMetric: '认知留存率 +88%',
        baselineMetric: '遗忘率 74%',
        steps: [
          '识别对称中心 x₀',
          '反问测试点对称差',
          '判定一阶导数单峰性质',
        ],
      };
    }

    if (userQuestion.includes('离心率') || userQuestion.includes('圆锥曲线') || userQuestion.includes('椭圆')) {
      return {
        strategy: '动态几何统一投影',
        masterFormula: "\\frac{|PF|}{d(P, L)} = e \\quad \\Longleftrightarrow \\quad r(\\theta) = \\frac{ep}{1 - e \\cos\\theta}",
        masterQuote: '“抓住圆锥截面倾角的几何直观，一式统领椭圆、双曲线与抛物线。”',
        baselineFormula: "e = \\frac{c}{a} = \\sqrt{1 - \\frac{b^2}{a^2}} \\quad [死记公式]",
        baselineCritique: '“只背公式字母，缺乏空间投影直觉，遇到倾斜截面题目极易卡壳。”',
        masterMetric: '几何直觉 +92%',
        baselineMetric: '题型迁移率 28%',
        steps: [
          '圆锥截面母线投影',
          '准线与焦半径比值定义',
          '统一极坐标方程降维',
        ],
      };
    }

    return {
      strategy: '拉格朗日中值与单调单射',
      masterFormula: "f(x_2) - f(x_1) = f'(\\xi)(x_2 - x_1) > 0 \\quad (x_1 < \\xi < x_2)",
      masterQuote: '“正命题由中值定理严密实证；逆命题想一想 y = x³ 在原点处的切线斜率！”',
      baselineFormula: "f'(x) > 0 \\iff f(x) \\uparrow \\quad [忽略零点边界条件]",
      baselineCritique: '“倒果为因，漏掉‘在任意区间不恒为0’的边界检验，高考丢分率极高。”',
      masterMetric: '避坑率 100%',
      baselineMetric: '边界漏判率 68%',
      steps: [
        '中值定理严密求证',
        '反例反思 y=x³ 原点切线',
        '边界导数不恒为零检验',
      ],
    };
  }, [scores, userQuestion]);

  return (
    <div className="page-shell" style={{ overflowX: 'hidden', padding: 0 }}>

      {/* =================================================================
          ACT I: APPLE MONUMENTAL HERO & STUDIO DISPLAY
          ================================================================= */}
      <section ref={heroRef} className="apple-fullbleed-band apple-fullbleed-band--hero">
        <div className="apple-stage-container">
          
          {/* Eyebrow */}
          <div className="apple-pro-eyebrow">
            <span className="apple-status-dot apple-status-dot--primary" />
            <span>名师智教 · 全息认知编译架构</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="apple-monumental-headline" style={{ textWrap: 'balance' }}>
            今天先透彻诊断他卡在哪<br />
            <span>再决定由哪位名师来讲</span>
          </h1>

          {/* Precision Subtitle */}
          <p className="apple-pro-subtitle" style={{ textWrap: 'balance' }}>
            拒绝通用 AI 的生搬硬套。基于毫米级多模态专注流与 IRT 认知穿透，即席重构特级名师专属解题基因。
          </p>

          {/* Apple Dual CTA Cluster */}
          <div className="apple-cta-cluster">
            <button
              type="button"
              className="apple-btn-pill-primary"
              onClick={() => onNavigate('collect', { collectSegment: 'monitor' })}
            >
              <span>启动全息学情采集</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="apple-btn-link"
              onClick={() => {
                const el = document.getElementById('workbench-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>调谐 5D 认知工作台</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Apple Studio Display Bezel (一体化微晶极简硬件展台) */}
          <div className="apple-studio-bezel">
            <div className="apple-studio-bezel-inner">
              
              {/* Window Controls Topbar */}
              <div className="apple-studio-topbar">
                <div className="apple-studio-dots">
                  <span className="apple-studio-dot apple-studio-dot--red" />
                  <span className="apple-studio-dot apple-studio-dot--yellow" />
                  <span className="apple-studio-dot apple-studio-dot--green" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                  <BookOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Apple Math Notes · {learnerName} · 压轴题思维阶梯</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                  <span className="apple-status-dot apple-status-dot--active" />
                  <span>LIVE 实时同频 · 12ms</span>
                </div>
              </div>

              {/* Display Core Canvas */}
              <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'center' }}>
                
                {/* Left: Apple Math Notes Thought Scaffolding */}
                <div className="apple-math-note-scaffold">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: '12px', fontWeight: 750, color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
                      名师解题思维阶梯 (MATH NOTES)
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      自适应 99.4%
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '13px' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,113,227,0.12)', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>1</span>
                      <div>
                        <div style={{ fontWeight: 650, color: 'var(--text-main)', marginBottom: 2 }}>构造对称差函数：</div>
                        <div style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                          F(x) = f(x) - f(2x₀ - x)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '13px' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,199,89,0.15)', color: '#34c759', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</span>
                      <div>
                        <div style={{ fontWeight: 650, color: 'var(--text-main)', marginBottom: 2 }}>一阶求导单调判定：</div>
                        <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                          F'(x) = f'(x) + f'(2x₀ - x)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '13px' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,149,0,0.15)', color: '#ff9500', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>3</span>
                      <div>
                        <div style={{ fontWeight: 650, color: 'var(--text-main)', marginBottom: 2 }}>单峰性质降维破局：</div>
                        <div style={{ color: '#ff9500', fontSize: '12px', fontWeight: 600 }}>
                          化二元极值为一元单调性，直破考点死结
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Dynamic Math Chalkboard & Voice Frequency */}
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 18, padding: '20px 24px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Ruler size={13} style={{ color: 'var(--accent-primary)' }} />
                      <span>LIVE MATH CHALKBOARD</span>
                    </span>
                    <div className="acoustic-eq-bar-wrap">
                      {eqLevels.map((lvl, idx) => (
                        <div key={idx} className="acoustic-eq-bar" style={{ height: `${lvl * 0.7}px`, background: 'var(--accent-primary)' }} />
                      ))}
                    </div>
                  </div>

                  {/* Math Curve Canvas */}
                  <svg viewBox="0 0 360 110" style={{ width: '100%', height: 110 }}>
                    <line x1="20" y1="95" x2="340" y2="95" stroke="var(--border-glass)" strokeWidth="1" />
                    <line x1="50" y1="10" x2="50" y2="105" stroke="var(--border-glass)" strokeWidth="1" />
                    <path
                      d={`M 50 85 Q 150 15 280 ${55 + Math.sin(waveOffset) * 6}`}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2.5"
                    />
                    <path
                      d={`M 280 85 Q 190 15 50 ${55 + Math.cos(waveOffset) * 6}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <circle cx="165" cy="40" r="4" fill="#ff9500" />
                    <line x1="165" y1="40" x2="165" y2="95" stroke="#ff9500" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="165" y="105" textAnchor="middle" fill="#ff9500" fontSize="10" fontFamily="monospace" fontWeight="bold">x₀</text>
                    <text x="250" y="45" fill="var(--accent-primary)" fontSize="11" fontFamily="monospace" fontWeight="bold">y = f(x)</text>
                    <text x="75" y="45" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">y = f(2x₀ - x)</text>
                  </svg>
                </div>

              </div>

              {/* Bottom Archetype Quick Switch Strip */}
              <div style={{ padding: '14px 32px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>快速切换考题求证:</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: '极值点偏移', query: '极值点偏移为什么一定要构造对称差函数？' },
                    { label: '圆锥曲线离心率', query: '椭圆与双曲线的离心率在几何统一性上怎么直观理解？' },
                    { label: '导数切线放缩', query: '为什么导数大于0函数一定单调递增，逆命题为何不成立？' },
                  ].map((token) => (
                    <button
                      key={token.label}
                      type="button"
                      onClick={() => setUserQuestion(token.query)}
                      style={{
                        background: userQuestion.includes(token.label.slice(0, 3)) ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                        border: `1px solid ${userQuestion.includes(token.label.slice(0, 3)) ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                        color: userQuestion.includes(token.label.slice(0, 3)) ? 'var(--accent-primary)' : 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: userQuestion.includes(token.label.slice(0, 3)) ? 700 : 500,
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {token.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =================================================================
          ACT II: 4-ACT CINEMATIC PIPELINE (四幕沉浸全景剧场)
          ================================================================= */}
      <section id="tour-stage-section" className="apple-fullbleed-band apple-fullbleed-band--dark">
        <div className="apple-stage-container">
          
          <div className="apple-pro-eyebrow">
            <Zap size={14} />
            <span>COGNITIVE CLOSED LOOP · 因果循迹全息闭环</span>
          </div>

          <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)', marginBottom: 12, textWrap: 'balance' }}>
            从草稿专注阻滞，到专属名师微课生成
          </h2>
          <p className="apple-pro-subtitle" style={{ marginBottom: 40, textWrap: 'balance' }}>
            四大核心感知与认知计算模块，一气呵成。
          </p>

          {/* Apple iOS-Style Segmented Capsule Bar */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="apple-segmented-capsule-bar">
              {[
                { idx: 0, label: '01 毫米级学情', icon: Activity },
                { idx: 1, label: '02 IRT 认知反应', icon: BarChart2 },
                { idx: 2, label: '03 5D 教学重组', icon: Sliders },
                { idx: 3, label: '04 虚拟微课剧场', icon: Tv },
              ].map((step) => {
                const IconComp = step.icon;
                return (
                  <button
                    key={step.idx}
                    type="button"
                    className={`apple-segmented-capsule-item ${activeStep === step.idx ? 'active' : ''}`}
                    onClick={() => setActiveStep(step.idx)}
                  >
                    <IconComp size={15} />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* The Apple Pro Display Hardware Stage */}
          <div className="apple-pro-display-frame" style={{ minHeight: 380 }}>
            
            {/* STAGE 01: 毫米级学情感知舱 */}
            {activeStep === 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span className="badge badge-blue">POD 01 · 毫米级视觉学情感知舱</span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>60fps 连续视线追踪</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    89.4%
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'stretch', marginBottom: 24 }}>
                  
                  {/* EEG & Attention Waves */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: 22, border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>专注微震脑电脉冲 (EEG PULSE)</span>
                        <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span className="apple-status-dot apple-status-dot--active" />
                          <span>沉浸搜寻</span>
                        </span>
                      </div>
                      <svg viewBox="0 0 300 70" style={{ width: '100%', height: 75, overflow: 'visible' }}>
                        <path
                          d={`M 0 35 Q 40 ${35 + Math.sin(waveOffset) * 20} 80 35 T 160 35 T 240 ${35 + Math.cos(waveOffset) * 18} T 300 35`}
                          fill="none"
                          stroke="var(--accent-primary)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="font-mono-telemetry" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-glass)' }}>
                      <span>今日专注: {focusMinutes} min</span>
                      <span>眨眼频次: 14 次/min</span>
                    </div>
                  </div>

                  {/* Simulated Student Draft Paper */}
                  <div className="apple-draft-paper">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>草稿纸演算与视网膜注视热点</span>
                      <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>X: 184 · Y: 312</span>
                    </div>

                    <div style={{ position: 'relative', height: 95 }}>
                      {/* Handwritten Math Formula Simulation on Draft Paper */}
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                        <div>f'(x) = 2x - a/x = (2x² - a)/x</div>
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>令 f'(x) = 0 =&gt; x₀ = √(a/2)</div>
                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>第3步: 对称差放缩阻滞... ?</div>
                      </div>

                      {/* Gaze Focus Rings on stuck step */}
                      <div style={{ position: 'absolute', right: 20, top: 20 }}>
                        <svg viewBox="0 0 100 60" style={{ width: 100, height: 60 }}>
                          <ellipse cx="50" cy="30" rx="36" ry="20" fill="none" stroke="rgba(0,113,227,0.2)" strokeWidth="1.5" />
                          <circle cx="50" cy="30" r="14" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
                          <circle cx={`${50 + Math.sin(waveOffset) * 4}`} cy={`${30 + Math.cos(waveOffset) * 3}`} r="5" fill="#ef4444" />
                        </svg>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: 10 }}>
                      <span className="apple-status-dot apple-status-dot--active" />
                      <span>视线锁定：在对称差放缩临界点停顿 18.4s</span>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>实时捕获阻滞时段: 18.4 分钟</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('collect')}>
                    <span>进入感知控制台</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 02: IRT 认知反应中枢 */}
            {activeStep === 1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span className="badge badge-amber">POD 02 · 项目反应理论 (IRT) 认知反应中枢</span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>三参数 Logistic 拟合</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    潜能 <strong style={{ color: 'var(--accent-primary)', fontSize: '2rem' }}>θ = +{irtTheta.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border-glass)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
                    <span>P(θ) 掌握概率函数曲线</span>
                    <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span className="apple-status-dot apple-status-dot--danger" />
                      <span>卡点: {weakPoint}</span>
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>潜能模拟调节:</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={irtTheta}
                      onChange={(e) => setIrtTheta(Number(e.target.value))}
                      className="apple-ios-slider"
                      style={{
                        flex: 1,
                        background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${((irtTheta - 0.5) / 2) * 100}%, #e5e5ea ${((irtTheta - 0.5) / 2) * 100}%, #e5e5ea 100%)`
                      }}
                    />
                    <span className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      θ = {irtTheta.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>推断置信度: 94% · 根因: 对数均值对称化放缩盲区</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('diagnose')}>
                    <span>进入认知热力矩阵</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 03: 5D 教学重组台 */}
            {activeStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span className="badge badge-emerald">POD 03 · 5D 教学基因重组台</span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>多维拟物微调</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center', marginBottom: 24 }}>
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

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RadarChart5D scores={scores} size={200} showLabels showComposite highlightColor="var(--accent-primary)" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>因材施教适配度: 100% · 苏格拉底递进反问</span>
                  <button
                    type="button"
                    className="apple-btn-pill-primary"
                    style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}
                    onClick={() => {
                      const el = document.getElementById('workbench-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>调谐参数</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 04: 微课演播剧场 */}
            {activeStep === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span className="badge badge-blue">POD 04 · 虚拟名师微课演播剧场</span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>思维阶梯演算</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '12px' }}>
                    +84% 思维自驱力
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, borderLeft: '4px solid var(--accent-primary)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 10 }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>专属名师：启发构造对称差函数 F(x) = f(x) - f(2x₀ - x)</strong>
                      <span className="font-mono-telemetry" style={{ color: '#10b981', fontWeight: 750 }}>认知阶梯 98%</span>
                    </div>
                    <div className="derivation-spectrum-bar" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: 10, fontWeight: 600 }}>
                      <span>① 发现对称中心</span>
                      <span>② 反问测试点</span>
                      <span>③ 单调单射证明</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, borderLeft: '4px solid #94a3b8', border: '1px solid var(--border-glass)', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 10 }}>
                      <strong style={{ color: 'var(--text-muted)' }}>通用基准 AI：暴力联立方程硬套对数均值公式</strong>
                      <span className="font-mono-telemetry" style={{ color: '#ef4444', fontWeight: 750 }}>遗忘率极高</span>
                    </div>
                    <div style={{ height: 6, background: '#94a3b8', borderRadius: 3, opacity: 0.3 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: 10 }}>
                      <span>① 硬套公式</span>
                      <span>② 直接给答案</span>
                      <span>✕ 无思考启发</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>板书支持 LaTeX KaTeX 实时几何推导</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('studio')}>
                    <span>试听专属微课</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Stage Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
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
            <span className="font-mono-telemetry" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 650 }}>
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

        </div>
      </section>

      {/* =================================================================
          ACT III: APPLE PRO STUDIO WORKBENCH (5D 认知基因调优实验室)
          ================================================================= */}
      <section id="workbench-section" className="apple-fullbleed-band apple-fullbleed-band--light">
        <div className="apple-stage-container">
          
          <div className="apple-pro-eyebrow">
            <Sliders size={14} />
            <span>INTERACTIVE COGNITIVE WORKBENCH · 5D 实时演练中枢</span>
          </div>

          <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)', maxWidth: 840, marginBottom: 12, textWrap: 'balance' }}>
            自主调节 5D 认知基因，实时透视生成差距
          </h2>
          <p className="apple-pro-subtitle" style={{ maxWidth: 680, marginBottom: 36, textWrap: 'balance' }}>
            轻拉滑块或输入您关心的考题，同屏直击特级名师启发支架与通用大模型的死板结论。
          </p>

          {/* Apple Spotlight Search / Input Capsule */}
          <form className="apple-spotlight-wrap" onSubmit={handleQuestionSubmit}>
            <Search size={18} className="apple-spotlight-icon" />
            <input
              type="text"
              className="apple-spotlight-input"
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              placeholder="输入数学考题或提问，例如：'圆锥曲线离心率的统一几何意义？'"
            />
            <button type="submit" className="apple-spotlight-btn">
              <span>实时求证</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Preset Question Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setUserQuestion(q)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: `1px solid ${userQuestion === q ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: userQuestion === q ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                  color: userQuestion === q ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: userQuestion === q ? 650 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: userQuestion === q ? '0 2px 10px rgba(0,113,227,0.15)' : 'none'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="workbench-wrap">
            
            {/* Left Column: Apple Pro Inspector */}
            <div className="workbench-controls apple-squircle-pod">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-main)' }}>
                  名师风格预设
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 650 }}>
                  {PRESETS.find((p) => p.id === selectedPreset)?.name || '自定义'}
                </span>
              </div>

              <div className="preset-chip-row" style={{ marginBottom: 24 }}>
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

              {/* 5D Axis Apple iOS Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {AXES.map((axis) => {
                  const val = scores[axis.key];
                  return (
                    <div key={axis.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
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
                        className="apple-ios-slider"
                        style={{
                          background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${val * 100}%, #e5e5ea ${val * 100}%, #e5e5ea 100%)`
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                💡 调节滑块将即席重构右侧专属名师的启发解题思维链与知识迁移深度。
              </div>

            </div>

            {/* Right Column: Keynote-grade Master vs Baseline Comparison Stage */}
            <div className="workbench-diff-container">
              
              {/* Master Teacher Bay */}
              <div className="apple-clean-diff-card apple-clean-diff-card--master">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GraduationCap size={20} style={{ color: 'var(--accent-primary)' }} />
                      <strong style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>定制特级名师</strong>
                    </div>
                    <span className="badge badge-blue font-mono-telemetry" style={{ fontSize: '11px' }}>
                      {dynamicDiffAnswer.masterMetric}
                    </span>
                  </div>

                  {/* Clean KaTeX Formula */}
                  <div style={{ margin: '16px 0', padding: '18px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 16, border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(dynamicDiffAnswer.masterFormula, true) }} />
                  </div>

                  {/* Editorial Thought Guidance */}
                  <div className="font-editorial" style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.75, background: 'rgba(0,113,227,0.05)', padding: '16px 18px', borderRadius: 14, borderLeft: '3px solid var(--accent-primary)', marginBottom: 16 }}>
                    {dynamicDiffAnswer.masterQuote}
                  </div>

                  {/* Step Hierarchy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {dynamicDiffAnswer.steps.map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-main)' }}>
                        <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span>阶梯 {idx + 1}: {st}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">启发式反问</span>
                    <span className="badge badge-emerald">数形结合降维</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5D 参数实时适配</span>
                  <button
                    type="button"
                    className="apple-btn-pill-primary"
                    style={{ height: '36px', padding: '0 18px', fontSize: '13px' }}
                    onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                  >
                    <span>注入名师工坊</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Baseline Generic AI Bay */}
              <div className="apple-clean-diff-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={20} style={{ color: 'var(--text-muted)' }} />
                      <strong style={{ fontSize: '16px', color: 'var(--text-muted)' }}>通用基准大模型</strong>
                    </div>
                    <span className="badge font-mono-telemetry" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px' }}>
                      {dynamicDiffAnswer.baselineMetric}
                    </span>
                  </div>

                  {/* Raw Formula */}
                  <div style={{ margin: '16px 0', padding: '18px 16px', background: 'var(--bg-muted)', borderRadius: 16, border: '1px dashed var(--border-glass)', textAlign: 'center', color: '#64748b' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(dynamicDiffAnswer.baselineFormula, true) }} />
                  </div>

                  {/* Muted Critique */}
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.75, background: 'var(--bg-surface)', padding: '16px 18px', borderRadius: 14, borderLeft: '3px solid #94a3b8', marginBottom: 16 }}>
                    {dynamicDiffAnswer.baselineCritique}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>直接灌输</span>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>无认知台阶</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>无个性化调优 · 遗忘率高</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =================================================================
          ACT IV: MONUMENTAL TELEMETRY (苹果发布会级数字展牌)
          ================================================================= */}
      <section className="apple-fullbleed-band" style={{ padding: '60px 0 100px' }}>
        <div className="apple-stage-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            
            <div className="apple-keynote-tile">
              <div className="apple-keynote-stat-val highlight">0.1 mm</div>
              <div className="apple-keynote-stat-title">微视线阻滞捕捉</div>
              <div className="apple-keynote-stat-desc">60fps 视网膜注视流，精确重构草稿纸顿挫点</div>
            </div>

            <div className="apple-keynote-tile">
              <div className="apple-keynote-stat-val">&lt; 1.2s</div>
              <div className="apple-keynote-stat-title">IRT 认知穿透收敛</div>
              <div className="apple-keynote-stat-desc">三参数动态 Logistic 拟合，秒级定位知识盲区</div>
            </div>

            <div className="apple-keynote-tile">
              <div className="apple-keynote-stat-val highlight">5D 空间</div>
              <div className="apple-keynote-stat-title">名师教学基因重组</div>
              <div className="apple-keynote-stat-desc">启发反问、公理破局、数形转化自由即席编译</div>
            </div>

            <div className="apple-keynote-tile">
              <div className="apple-keynote-stat-val highlight">+88%</div>
              <div className="apple-keynote-stat-title">压轴题思维留存</div>
              <div className="apple-keynote-stat-desc">启发式支架引导，彻底解决考场变式卡点</div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
