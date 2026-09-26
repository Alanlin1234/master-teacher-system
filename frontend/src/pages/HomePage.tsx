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
  Eye,
  Sliders,
  AlertCircle,
  Check,
  Terminal,
  Layers,
  BookOpen,
  Cpu,
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
    name: '苏格拉底递进启发型',
    prompt: '高三理科 · 极值点偏移压轴题 · 编译苏格拉底递进反问名师...',
    scores: { style: 0.25, method: 0.35, strengths: 0.92, personality: 0.88, communication: 0.3 },
  },
  {
    id: 'olympiad',
    name: '竞赛金牌破局型',
    prompt: '全国联赛 · 导数与零点放缩 · 编译竞赛公理极简证明名师...',
    scores: { style: 0.95, method: 0.92, strengths: 0.88, personality: 0.55, communication: 0.9 },
  },
  {
    id: 'gaokao',
    name: '高三压轴冲刺型',
    prompt: '一模压轴 · 圆锥曲线联立弦长 · 编译模板切片快速破法名师...',
    scores: { style: 0.75, method: 0.88, strengths: 0.45, personality: 0.72, communication: 0.82 },
  },
  {
    id: 'visual',
    name: '几何数形具象型',
    prompt: '高中几何 · 椭圆与双曲线统一性 · 编译动态数形几何建模名师...',
    scores: { style: 0.35, method: 0.45, strengths: 0.98, personality: 0.85, communication: 0.4 },
  },
];

const VIBE_TOKENS = [
  { label: '极值点偏移', query: '极值点偏移为什么一定要构造对称差函数？' },
  { label: '圆锥曲线离心率', query: '椭圆与双曲线的离心率在几何统一性上怎么直观理解？' },
  { label: '导数切线放缩', query: '为什么导数大于0函数一定单调递增，逆命题为何不成立？' },
  { label: '苏格拉底反问', preset: 'socratic' },
  { label: '竞赛公理推导', preset: 'olympiad' },
  { label: '数形结合建模', preset: 'visual' },
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
  const reelViewportRef = useRef<HTMLDivElement>(null);
  
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
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
      setPromptText(`正在编译考点：${token.label} · 匹配特级名师因材施教知识模型...`);
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

  const handleScrollToReelPod = (index: number) => {
    const clamped = Math.max(0, Math.min(3, index));
    setActiveReelIndex(clamped);
    if (!reelViewportRef.current) return;
    const target = reelViewportRef.current.children[0]?.children[clamped] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const learnerName = getLearnerName() || '林同学 (高三理科冲刺)';
  const weakPoint = diagnosis?.weakKnowledge?.[0] || '极值点偏移与对数均值不等式';

  // Dynamic response generated based on current 5D parameters
  const dynamicDiffAnswer = useMemo(() => {
    const isSocratic = scores.style < 0.5;
    const isVisual = scores.strengths > 0.6;
    const isRigorous = scores.method > 0.6;

    if (userQuestion.includes('极值点偏移') || userQuestion.includes('差函数')) {
      return {
        strategy: isSocratic ? '苏格拉底启发阶梯' : '竞赛公理深度推导',
        lead: isSocratic
          ? '“已知 x₁ + x₂ > 2x₀。如果直接联立方程相减，很难判定正负。那我们能不能换个角度——既然极值对称中心是 x₀，不妨构造对称测试点 x\' = 2x₀ - x₁？此时 f(x\') 与 f(x₁) 的高低关系是什么？”'
          : '对于极值点偏移问题，构造对称差函数是利用单峰函数的单调单射性。通过求导并利用对数均值不等式放缩，直接将二元极值约束降维成一元符号判别。',
        corePoints: [
          '① 发现极值中心 x₀，将非对称区间 [x₁, x₂] 镜像映射到同侧。',
          '② 构造辅助差函数 F(x) = f(x) - f(2x₀ - x)，求导判定单调性。',
          '③ 利用 F\'(x) > 0 结合端点零点，严谨反推极值点位移偏向。',
        ],
        formula: 'F(x) = f(x) - f(2x_0 - x) \\implies F\'(x) = f\'(x) + f\'(2x_0 - x)',
        summary: isVisual
          ? '数形图解：对称曲线在 x₀ 处相切，割线斜率始终大于切线斜率，几何直观一目了然！'
          : '逻辑支架：成功规避盲目通分硬算的陷阱，推导步骤压缩 65%。',
        tags: [
          { text: isSocratic ? '启发式反问' : '公理级推导', type: isSocratic ? 'socratic' : 'axiom' },
          { text: isVisual ? '数形结合直观' : '严密逻辑降维', type: 'scaffold' },
          { text: '认知留存率 +88%', type: 'socratic' },
        ],
      };
    }

    if (userQuestion.includes('离心率') || userQuestion.includes('圆锥曲线')) {
      return {
        strategy: isVisual ? '动态几何统一投影' : '代数齐次化速通',
        lead: isVisual
          ? '“想象一个平面从不同角度截取圆锥——当截面倾角小于母线时是椭圆，平行时是抛物线，大于时是双曲线。离心率 e 本质上是‘截面倾角正弦与母线倾角正弦的比值’！”'
          : '圆锥曲线的第二定义统领一切：平面上到定点（焦点）与到定直线（准线）的距离之比为常数 e。0 < e < 1 为椭圆，e = 1 为抛物线，e > 1 为双曲线。',
        corePoints: [
          '① 统一定义：焦半径与准线距离之比恒为 e，无需分别记忆几何性质。',
          '② 极坐标方程：r = ep / (1 - e·cosθ)，一式覆盖全部二次曲线。',
          '③ 离心率的物理意义：轨道偏心程度与引力轨道逃逸速度的代数刻画。',
        ],
        formula: '\\frac{|PF|}{d(P, L)} = e \\quad \\Longleftrightarrow \\quad r(\\theta) = \\frac{ep}{1 - e \\cos\\theta}',
        summary: '名师视角：抓住了 Dandelin 双球截面图景，考场上无需死记生硬代数公式即可秒判离心率范围。',
        tags: [
          { text: '动态截面模型', type: 'scaffold' },
          { text: '数形本质还原', type: 'axiom' },
          { text: '几何内驱力 +92%', type: 'socratic' },
        ],
      };
    }

    return {
      strategy: isRigorous ? '拉格朗日中值与单调单射' : '直观变化率启发',
      lead: isRigorous
        ? '“对于可导函数 f(x)，若 f\'(x) > 0 恒成立，由拉格朗日中值定理：任意 x₁ < x₂ 必存在 ξ ∈ (x₁, x₂) 使得 f(x₂) - f(x₁) = f\'(ξ)(x₂ - x₁) > 0，故严格单调增。”'
        : '“很多同学容易混淆：导数大于 0 则递增，但为什么反过来‘递增’不一定‘导数大于0’？想一想 y = x³ 在原点处的切线斜率是多少？零斜率阻碍它的前进了吗？”',
      corePoints: [
        '① 正命题：f\'(x) > 0 是严格单调递增的充分非必要条件。',
        '② 逆命题反例：y = x³ 在 R 上严格递增，但在 x = 0 处 f\'(0) = 0。',
        '③ 完备充要条件：f\'(x) ≥ 0 且在任意开区间内不恒为 0。',
      ],
      formula: 'f(x_2) - f(x_1) = f\'(\\xi)(x_2 - x_1) > 0 \\quad (x_1 < \\xi < x_2)',
      summary: '避坑指引：高考极高频陷阱！判别参数范围时若漏掉“不恒为0”的边界检验，整题扣除4分。',
      tags: [
        { text: '严格中值定理', type: 'axiom' },
        { text: '反例思辨教学', type: 'socratic' },
        { text: '避坑率 100%', type: 'scaffold' },
      ],
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
            <span>VIBE CODING STUDIO · 名师即席编译中枢</span>
          </div>

          {/* Impeccable High-Impact Headline */}
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
                placeholder="键入知识盲区或选择提示词编译专属名师..."
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
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', alignSelf: 'center', marginRight: 4 }}>快速提示 Token:</span>
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

              <div style={{ lineHeight: 1.8, textAlign: 'left' }}>
                <p style={{ color: '#64748b' }}>// TARGET_LEARNER: {learnerName}</p>
                <p style={{ color: '#64748b' }}>// BOTTLENECK: {weakPoint}</p>
                <p style={{ color: '#93c5fd' }}>&gt; TENSOR_WEIGHTS: [{Object.values(scores).map((v) => v.toFixed(2)).join(', ')}]</p>
                <p style={{ color: '#34d399' }}>&gt; SYNAPSE_AST: {selectedPreset.toUpperCase()}_Prompt_Scaffold</p>
                <p style={{ color: '#cbd5e1' }}>&gt; THEOREM_INJECT: F(x) = f(x) - f(2x₀ - x)</p>
                <p style={{ color: '#f59e0b' }}>&gt; DERIVATIVE_ORDER: 1st_Difference_Monotonicity</p>
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
                  {/* Coordinate Axes */}
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
                  
                  {/* Dynamic Tangent Point */}
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
                <div style={{ fontSize: '12px', color: '#93c5fd', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>名师点拨：利用导数单峰性质判定</span>
                  <span dangerouslySetInnerHTML={{ __html: renderKatexHtml("F'(x) > 0") }} />
                  <span>，将二元极值约束降为一元单调性判定。</span>
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
              onClick={() => handleScrollToReelPod(1)}
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
            PROGRESSIVE CONNECTING CONDUIT SPINE 1 (衔接导轨：从首屏到四环闭环)
            ================================================================= */}
        <div className="apple-conduit-spine">
          <div className="apple-spine-line">
            <div className="apple-spine-dot" />
          </div>
          <div className="apple-spine-badge">
            <Activity size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>因果流转 · 循序渐进认知闭环</span>
          </div>
          <p className="apple-spine-narrative">
            当毫米级视觉流探知学生草稿停滞，IRT 认知引擎即席拟合潜能曲线，驱动 5D 教学参数针对性重组，最终交付无死角的板书微课。
          </p>
        </div>

        {/* =================================================================
            2. APPLE PRODUCT TOUR STAGE (四环因材施教闭环全幅步进器)
            ================================================================= */}
        <section className="apple-product-stage">
          {/* Step Navigation Bar */}
          <div className="apple-stage-step-bar">
            {[
              { idx: 0, num: 'STEP 01', title: '毫米级视觉学情感知舱', caption: '视线与专注微震捕获' },
              { idx: 1, num: 'STEP 02', title: 'IRT 认知反应中枢', caption: '三参数 Logistic 潜能拟合' },
              { idx: 2, num: 'STEP 03', title: '5D 教学基因重组台', caption: '多维教学法即席重构' },
              { idx: 3, num: 'STEP 04', title: '虚拟名师微课剧场', caption: '印刷级黑板动态推导' },
            ].map((step) => (
              <button
                key={step.idx}
                type="button"
                className={`apple-stage-step-btn ${activeReelIndex === step.idx ? 'active' : ''}`}
                onClick={() => handleScrollToReelPod(step.idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className="apple-step-num">{step.num}</span>
                  {activeReelIndex === step.idx && <span className="apple-status-dot apple-status-dot--primary" />}
                </div>
                <span className="apple-step-title">{step.title}</span>
                <span className="apple-step-caption">{step.caption}</span>
              </button>
            ))}
          </div>

          {/* Glide Arrows Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              左右滑动或点击上方卡片探索闭环阶段细节
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="reel-nav-btn"
                onClick={() => handleScrollToReelPod(activeReelIndex - 1)}
                title="上一阶段"
                aria-label="上一阶段"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="reel-nav-btn"
                onClick={() => handleScrollToReelPod(activeReelIndex + 1)}
                title="下一阶段"
                aria-label="下一阶段"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Draggable & Panoramic Reel Viewport */}
          <div className="horizontal-reel-viewport" ref={reelViewportRef}>
            <div className="horizontal-reel-track">
              
              {/* POD 01: 毫米级学情感知舱 */}
              <div className="reel-pod-card apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-blue">POD 01 · 毫米级视觉与学情感知舱</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>60fps 连续视线追踪</span>
                  </div>
                  <span className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    89.4%
                  </span>
                </div>

                {/* Pure Visual Instrument Stage: Eye Radar + Live Waveform */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center', flex: 1 }}>
                  {/* Live SVG Waveform Canvas */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>专注微震脑电脉冲波形 (EEG PULSE)</span>
                      <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span className="apple-status-dot apple-status-dot--active" />
                        <span>沉浸推导</span>
                      </span>
                    </div>
                    <svg viewBox="0 0 300 70" style={{ width: '100%', height: 70, overflow: 'visible' }}>
                      <path
                        d={`M 0 35 Q 40 ${35 + Math.sin(waveOffset) * 20} 80 35 T 160 35 T 240 ${35 + Math.cos(waveOffset) * 18} T 300 35`}
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', marginTop: 8 }}>
                      <span>今日专注累积: {focusMinutes} min</span>
                      <span>眨眼频次: 14 次/min (正常)</span>
                    </div>
                  </div>

                  {/* Pupil Tracking Radar */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                    <svg viewBox="0 0 160 100" style={{ width: '100%', height: 90 }}>
                      <ellipse cx="80" cy="50" rx="60" ry="38" fill="none" stroke="var(--border-glass)" strokeWidth="1.5" />
                      <circle cx="80" cy="50" r="22" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="4 2" />
                      <circle cx={`${80 + Math.sin(waveOffset) * 8}`} cy={`${50 + Math.cos(waveOffset) * 5}`} r="7" fill="var(--accent-primary)" />
                      <text x="80" y="96" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="600">
                        视线锁定 · 草稿第3步凝滞捕获
                      </text>
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>实时捕获阻滞时段: 18.4 分钟</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => onNavigate('collect')}>
                    <span>进入感知控制台</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* POD 02: IRT 认知反应中枢 */}
              <div className="reel-pod-card apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-amber">POD 02 · 项目反应理论 (IRT) 认知反应中枢</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>三参数 Logistic 曲线拟合</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    潜能 <strong style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }}>θ = +{irtTheta.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Interactive IRT Curve Canvas */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border-glass)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: 8 }}>
                    <span>P(θ) 掌握概率函数曲线</span>
                    <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="apple-status-dot apple-status-dot--danger" />
                      <span>锁定卡点: {weakPoint}</span>
                    </span>
                  </div>
                  <svg viewBox="0 0 400 120" style={{ width: '100%', height: 110 }}>
                    <line x1="30" y1="100" x2="380" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    <line x1="30" y1="10" x2="30" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    {/* S-curve dynamically shifting with irtTheta */}
                    <path
                      d={`M 30 95 C 100 95 ${150 + irtTheta * 15} 60 ${200 + irtTheta * 15} 30 C 250 15 320 15 380 15`}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="3"
                    />
                    <circle cx={`${200 + irtTheta * 15}`} cy="30" r="6" fill="#ef4444" />
                    <text x={`${200 + irtTheta * 15}`} y="20" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">
                      林同学实际掌握点 (P=0.38)
                    </text>
                  </svg>
                  {/* Slider to interactively adjust theta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>潜能调节:</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={irtTheta}
                      onChange={(e) => setIrtTheta(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                    />
                    <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      θ = {irtTheta.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>推断置信度: 94% · 根因: 对数均值对称化放缩盲区</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => onNavigate('diagnose')}>
                    <span>进入认知热力矩阵</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* POD 03: 5D 教学重组台 */}
              <div className="reel-pod-card apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-emerald">POD 03 · 5D 教学基因重组台</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>拟物旋钮与声学电平</span>
                  </div>
                  <div className="preset-chip-row" style={{ margin: 0 }}>
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`preset-chip ${selectedPreset === p.id ? 'active' : ''}`}
                        onClick={() => handlePresetSelect(p)}
                      >
                        {p.name.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotary Knobs & 5D Radar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center', flex: 1 }}>
                  {/* Rotary Dials for 5 dimensions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                    {AXES.slice(0, 4).map((axis) => {
                      const deg = -90 + scores[axis.key] * 180;
                      return (
                        <div key={axis.key} style={{ textAlign: 'center' }}>
                          <div className="rotary-dial-container" style={{ margin: '0 auto 6px' }}>
                            <div className="rotary-dial-pointer" style={{ transform: `rotate(${deg}deg)` }} />
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', zIndex: 1 }}>
                              {Math.round(scores[axis.key] * 100)}%
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 650 }}>{axis.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 5D Radar Stage */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RadarChart5D scores={scores} size={180} showLabels showComposite highlightColor="var(--accent-primary)" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>因材施教适配度: 100% · 苏格拉底递进反问</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => {
                      const el = document.getElementById('workbench-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>前往参数工作台</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* POD 04: 微课演播剧场 */}
              <div className="reel-pod-card apple-squircle-pod">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-blue">POD 04 · 虚拟名师微课演播剧场</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>纯净黑板演算与步骤光谱</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                    +84% 思维自驱力
                  </span>
                </div>

                {/* Derivation Spectrum Comparison */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                  {/* Master Teacher Spectrum Bar */}
                  <div style={{ background: 'rgba(37,99,235,0.06)', borderRadius: 10, padding: 14, borderLeft: '3px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>专属名师：启发构造对称差函数 F(x) = f(x) - f(2x₀ - x)</strong>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>认知阶梯 98%</span>
                    </div>
                    <div className="derivation-spectrum-bar" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>① 发现对称中心</span>
                      <span>② 反问测试点</span>
                      <span>③ 单调单射证明</span>
                    </div>
                  </div>

                  {/* Generic AI Baseline Spectrum Bar */}
                  <div style={{ background: 'var(--bg-muted)', borderRadius: 10, padding: 14, borderLeft: '3px solid #64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--text-subtle)' }}>通用基准 AI：暴力联立方程硬套对数均值公式</strong>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>遗忘率极高</span>
                    </div>
                    <div style={{ height: 6, background: '#64748b', borderRadius: 3, opacity: 0.5 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', marginTop: 4 }}>
                      <span>① 硬套公式</span>
                      <span>② 直接给答案</span>
                      <span>✕ 无思考启发</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>板书支持 LaTeX KaTeX 实时几何推导</span>
                  <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => onNavigate('studio')}>
                    <span>前往演播厅试听微课</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =================================================================
            PROGRESSIVE CONNECTING CONDUIT SPINE 2 (衔接导轨：从闭环到工作台)
            ================================================================= */}
        <div className="apple-conduit-spine">
          <div className="apple-spine-line">
            <div className="apple-spine-dot" />
          </div>
          <div className="apple-spine-badge">
            <Sliders size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>深度互动演练 · 亲验参数分界</span>
          </div>
          <p className="apple-spine-narrative">
            名师的教学风格不是一句口号。在下方工作台中自由调节认知参数并输入真题，同屏直击名师启发支架与通用 AI 的答复差距。
          </p>
        </div>

        {/* =================================================================
            3. INTERACTIVE 5D WORKBENCH (5D 双栏教学法实时差分对比工作台)
            ================================================================= */}
        <section id="workbench-section" style={{ margin: '40px 0 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="apple-hero-badge" style={{ marginBottom: 12 }}>
              <Zap size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>INTERACTIVE COGNITIVE WORKBENCH · 5D 实时演练中枢</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', letterSpacing: '-0.035em', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
              自主调节 5D 认知基因，实时透视名师与通用 AI 的答复差距
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-body)', maxWidth: 720, margin: '0 auto', lineHeight: 1.6 }}>
              拒绝黑盒盲信。自由键入难题或选择经典压轴题，拖动教学法滑块，同屏比对名师因材施教的启发认知支架与通用大模型的死板结论。
            </p>
          </div>

          <div className="workbench-wrap">
            
            {/* Left Column: Sliders & Controls */}
            <div className="workbench-controls apple-squircle-pod">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-main)' }}>
                  名师风格快捷预设
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  当前: {PRESETS.find((p) => p.id === selectedPreset)?.name || '自定义调谐'}
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

              {/* 5D Axis Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                {AXES.map((axis) => {
                  const val = scores[axis.key];
                  return (
                    <div key={axis.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-main)' }}>
                          {axis.label}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>{axis.low}</span>
                          <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--accent-primary)', minWidth: 32, textAlign: 'right' }}>
                            {Math.round(val * 100)}%
                          </span>
                          <span>{axis.high}</span>
                        </div>
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

              {/* Question Input Box */}
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                <label htmlFor="user-question-input" style={{ display: 'block', fontSize: '13px', fontWeight: 650, color: 'var(--text-main)', marginBottom: 8 }}>
                  输入待求证考题或知识难点：
                </label>
                <textarea
                  id="user-question-input"
                  rows={2}
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="输入你想测试名师解题启发的问题..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-academic)',
                    background: 'var(--bg-surface)',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setUserQuestion(q)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-glass)',
                        background: userQuestion === q ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                        color: userQuestion === q ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {q.slice(0, 16)}...
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Split Comparison Cards */}
            <div className="workbench-diff-container">
              
              {/* Card 1: Your Tuned Master Teacher */}
              <div className="workbench-card workbench-card--master apple-squircle-pod">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
                      <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>您调谐的专属特级名师</strong>
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                      {dynamicDiffAnswer.strategy}
                    </span>
                  </div>

                  {/* Dynamic Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {dynamicDiffAnswer.tags.map((tag) => (
                      <span key={tag.text} className={`diff-tag-${tag.type}`} style={{ padding: '3px 9px', borderRadius: 4, fontSize: '11px', fontWeight: 700 }}>
                        {tag.text}
                      </span>
                    ))}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 12, fontWeight: 550, background: 'rgba(37,99,235,0.04)', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid var(--accent-primary)' }}>
                    {dynamicDiffAnswer.lead}
                  </p>

                  {/* Math Formula Rendered with KaTeX */}
                  <div style={{ margin: '10px 0', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(dynamicDiffAnswer.formula, true) }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {dynamicDiffAnswer.corePoints.map((point, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid rgba(37,99,235,0.4)' }}>
                        {point}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--accent-primary)', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', lineHeight: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={15} style={{ flexShrink: 0 }} />
                    <span>{dynamicDiffAnswer.summary}</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已根据当前 5D 参数实时适配</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                  >
                    <span>注入名师工坊</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Card 2: Standard Baseline Generic AI */}
              <div className="workbench-card apple-squircle-pod">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={18} style={{ color: 'var(--text-muted)' }} />
                      <strong style={{ fontSize: '15px', color: 'var(--text-muted)' }}>标准通用基准大模型</strong>
                    </div>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: '11px' }}>
                      未定制通用模型
                    </span>
                  </div>

                  {/* Generic Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="diff-tag-generic" style={{ padding: '3px 9px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      直给公式结论
                    </span>
                    <span className="diff-tag-generic" style={{ padding: '3px 9px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      无认知支架
                    </span>
                    <span className="diff-tag-generic" style={{ padding: '3px 9px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      考场难以迁移
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 12, background: 'var(--bg-muted)', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid #94a3b8' }}>
                    “针对该问题，直接列出通用不等式或方程组。令代数式等于目标值，代入数值进行暴力移项化简，得出最终解。”
                  </p>

                  <div style={{ margin: '10px 0', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px dashed var(--border-glass)', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      [直接输出结果]: x₁ + x₂ = 2x₀ + Δx ⇒ 套用公式可得结论
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid #cbd5e1' }}>
                      ① 步骤一：机械罗列教案公式，未解释为什么要这样构造。
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid #cbd5e1' }}>
                      ② 步骤二：跳过直觉图景，直接进行复杂代数运算。
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid #cbd5e1' }}>
                      ③ 步骤三：直接输出最终不等式答案。
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-glass)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <span>痛点剖析：传统通用大模型直接照搬教案条目，学生遇到变形题依然不会举一反三；而上方左侧名师能根据学生的基因参数，智能选择“苏格拉底反问”、“公理证明”或“化简速通”，实现真正的因材施教。</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>基准无个性化认知调优</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =================================================================
            4. SYSTEM CAPABILITY METRICS (全链路四维赋能矩阵)
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
        className="stat-figure tabular-nums"
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
