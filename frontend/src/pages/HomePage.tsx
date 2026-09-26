import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadarChart5D } from '../components/RadarChart5D';
import { FocusSparkline } from '../components/FocusSparkline';
import {
  ArrowRightIcon,
  SlidersIcon,
  VideoCameraIcon,
  SearchIcon,
  DnaIcon,
  GraduationCapIcon,
} from '../components/Icons';
import { useCountUp, useHeroEntrance, useMasteryReveal } from '../lib/gsap';
import { monitorApi } from '../services/eduApi';
import { getLearnerId, getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; teacherSection?: string; initialScores?: Record<string, number> }) => void;
}

const TIMELINE_PHASES = [
  {
    phase: '01',
    label: '多模态采集',
    title: '多维感知 · 毫秒级专注追踪',
    claim: '摄像头微晶视觉与专注波形遥测，秒级捕捉学情波动与解题卡点。',
    tab: 'collect',
    action: '进入采集工作台',
    icon: VideoCameraIcon,
    metrics: [
      { label: '视线凝视追踪', val: '60 fps 实时' },
      { label: '行为中断捕捉', val: '98.4% 灵敏' },
      { label: '生理专注脉冲', val: '同态滤波拟合' },
    ],
    badgeColor: 'badge-blue',
  },
  {
    phase: '02',
    label: '认知诊断',
    title: '潜能透视 · IRT 错因溯源',
    claim: '项目反应理论计算 Theta 潜能，定位知识盲区与病理错因特征。',
    tab: 'diagnose',
    action: '查看认知诊断',
    icon: SearchIcon,
    metrics: [
      { label: '能力潜能 Theta', val: '+1.42 (优良)' },
      { label: '高考考点覆盖', val: '18 个核心图谱' },
      { label: '薄弱根因溯源', val: '渐近线概念混淆' },
    ],
    badgeColor: 'badge-amber',
  },
  {
    phase: '03',
    label: '名师合成',
    title: '基因重组 · 五维教学流派推导',
    claim: '风格、方法、特长五维参数重组，一键推导专属个性化答疑名师。',
    tab: 'library',
    action: '探索名师智库',
    icon: DnaIcon,
    metrics: [
      { label: '教学基因触点', val: '5 个微调旋钮' },
      { label: '流派推导算法', val: '多维空间投影' },
      { label: '教学 Prompt', val: '动态注入学情' },
    ],
    badgeColor: 'badge-emerald',
  },
  {
    phase: '04',
    label: '微课呈现',
    title: '视听交互 · 拟真数字人讲解答疑',
    claim: '超拟真数字人即时讲解答疑，将抽象推演化为生动的互动微课。',
    tab: 'studio',
    action: '前往微课互动',
    icon: GraduationCapIcon,
    metrics: [
      { label: '超拟真数字人', val: '4K 唇形同步' },
      { label: '动态几何板书', val: '分步公式具象' },
      { label: '双向答疑延迟', val: '< 650 ms' },
    ],
    badgeColor: 'badge-cyan',
  },
];

const DEMO_SAMPLES = [68, 72, 70, 76, 84, 82, 89, 94, 91, 95];

const DEMO_MASTERY: Array<[string, number]> = [
  ['圆锥曲线离心率与渐近线', 42],
  ['立体几何二面角法向量', 55],
  ['导数极值与隐零点代换', 88],
];

interface QuestionSlice {
  id: string;
  topic: string;
  title: string;
  question: string;
  baselineSlices: {
    intro: string;
    core: string;
    wrap: string;
  };
}

const PRESET_QUESTIONS: QuestionSlice[] = [
  {
    id: 'phys-lenz',
    topic: '物理',
    title: '楞次定律本质直观理解',
    question: '楞次定律中的“增反减同”到底怎么从本质能量角度直观理解？定则容易搞混。',
    baselineSlices: {
      intro: '① 引入切片 · 机械照搬：直接背诵“感应电流总要阻碍引起它的磁通量变化”。',
      core: '② 破局切片 · 硬套口诀：机械运用增反减同，判断原磁场后再用安培右手定则。',
      wrap: '③ 巩固切片 · 缺乏互动：直接给出公式 ε = -dΦ/dt，无追问与思维延伸。',
    },
  },
  {
    id: 'math-derivative',
    topic: '数学',
    title: '导数隐零点代换破局',
    question: '导数压轴题导函数零点求不出来时，怎么化简原式消除高次项？',
    baselineSlices: {
      intro: '① 引入切片 · 机械照搬：直接写“设零点为 x0，代入原式计算”。',
      core: '② 破局切片 · 硬套公式：列出多项式硬算展开，容易陷入死胡同。',
      wrap: '③ 巩固切片 · 缺乏互动：无零点存在性证明提示，未指出拿步骤分技巧。',
    },
  },
  {
    id: 'chem-galvanic',
    topic: '化学',
    title: '原电池电极与电子流向',
    question: '在盐桥原电池中，阳离子往哪极移动？为什么内电路是离子移动？',
    baselineSlices: {
      intro: '① 引入切片 · 机械照搬：直接给出结论“负极失电子，正极得电子”。',
      core: '② 破局切片 · 硬套口诀：直接背诵“阳移正，阴移负”，无微观电荷代偿分析。',
      wrap: '③ 巩固切片 · 缺乏互动：未解释电子为何不能跨越固液相界面。',
    },
  },
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [forceDemoMode, setForceDemoMode] = useState(false);

  // Timeline stage active phase (0 to 3)
  const [activePhase, setActivePhase] = useState(0);

  // 5D Workbench state
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionSlice>(PRESET_QUESTIONS[0]);
  const [customQuestionInput, setCustomQuestionInput] = useState(PRESET_QUESTIONS[0].question);
  const [scores, setScores] = useState({
    style: 0.94,
    personality: 0.88,
    strengths: 0.96,
    method: 0.92,
    communication: 0.86,
  });

  useHeroEntrance(heroRef);

  useEffect(() => {
    const id = getLearnerId();
    const storedDiag = readDiagnosis();
    setDiagnosis(storedDiag);

    if (!id) {
      setFocusMinutes(null);
      setSamples([]);
      return;
    }

    let cancelled = false;
    Promise.all([
      monitorApi.getDashboard(id, id),
      monitorApi.getSessions(id, id),
    ]).then(([dash, sessions]) => {
      if (cancelled) return;
      const seconds = dash.stats?.focus_seconds_today;
      setFocusMinutes(typeof seconds === 'number' ? Math.round(seconds / 60) : 48);
      const scoresArr: number[] = [];
      (sessions.sessions || []).forEach((session) => {
        (session.attention_data || []).forEach((point) => {
          if (typeof point.score === 'number') scoresArr.push(point.score);
        });
      });
      setSamples(scoresArr.length > 2 ? scoresArr.slice(-12) : DEMO_SAMPLES);
    }).catch(() => {
      if (!cancelled) {
        setFocusMinutes(48);
        setSamples(DEMO_SAMPLES);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const bound = getLearnerId() != null;
  const isShowingDemo = !bound || forceDemoMode;

  const activeMasteryRows = useMemo(() => {
    if (isShowingDemo) return DEMO_MASTERY;
    if (!diagnosis || !Object.keys(diagnosis.knowledgeMastery).length) return DEMO_MASTERY;
    return Object.entries(diagnosis.knowledgeMastery)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([k, v]) => [k, Math.round(v <= 1 ? v * 100 : v)] as [string, number]);
  }, [diagnosis, isShowingDemo]);

  useMasteryReveal(hudRef, activeMasteryRows.map((r) => r[0]).join('|'));

  const knowledgeCount = isShowingDemo ? 18 : (diagnosis ? Object.keys(diagnosis.knowledgeMastery).length : 18);
  const weakCount = isShowingDemo ? 2 : (diagnosis ? diagnosis.weakCount : 2);
  const effectiveFocus = focusMinutes ?? 48;

  const countFocus = useCountUp(effectiveFocus, 1.2, true);
  const countKnowledge = useCountUp(knowledgeCount, 1.2, true);
  const countWeak = useCountUp(weakCount, 1.2, true);

  // Archetype computation
  const archetype = useMemo(() => {
    if (scores.style >= 0.85 && scores.method >= 0.85) return '公理严密 · 高考压轴型';
    if (scores.style < 0.75 && scores.personality >= 0.85) return '启发递进 · 温情伴学型';
    if (scores.strengths >= 0.9) return '高维建模 · 穿透核心型';
    return '多维平衡 · 全景解析型';
  }, [scores]);

  // Master teacher dynamic slice responses
  const masterSlices = useMemo(() => {
    const isSocratic = scores.style < 0.75 || scores.method < 0.75;
    const isRigorous = scores.style >= 0.85;

    if (selectedQuestion.id === 'phys-lenz') {
      return {
        tags: [
          isSocratic ? { type: 'socratic', text: '启发反问' } : { type: 'axiom', text: '公理闭环' },
          { type: 'scaffold', text: '能量守恒' },
        ],
        intro: isSocratic
          ? '① 引入切片 · 启发反问：抓住宇宙底层逻辑——如果靠近时线圈顺从吸引，不需外力就能无限发电，这违反了什么？对，能量守恒！'
          : '① 引入切片 · 公理基石：楞次定律是热力学第一定律在电磁领域的刚性体现，本质是机械做功向电能转化的抗拒。',
        core: isRigorous
          ? '② 破局切片 · 严密推导：外磁通 dΦ/dt > 0，感应通量必须 Φ_ind < 0 阻碍通量变化，右手定则一锤定音。'
          : '② 破局切片 · 直观建模：“增反减同”与“来拒去留”是同一物理实在的两个投影，做功必有阻力。',
        wrap: '③ 巩固切片 · 举一反三：思考题：强磁铁自由落体穿过铜管，加速度为什么小于 g？',
      };
    } else if (selectedQuestion.id === 'math-derivative') {
      return {
        tags: [
          { type: 'axiom', text: '设而不求' },
          { type: 'scaffold', text: '同构消元' },
        ],
        intro: '① 引入切片 · 破局思路：高考不考解超越方程，隐零点的灵魂在于“设而不求”与“等量消元”。',
        core: '② 破局切片 · 严密推导：先用零点定理锁定 x0 范围，再用 f\'(x0)=0 建立指数/对数与多项式的等价代换。',
        wrap: '③ 巩固切片 · 步骤拿分：在考卷上写出“令 f\'(x0)=0”即可锁定核心步骤分！',
      };
    } else {
      return {
        tags: [
          { type: 'axiom', text: '电对电势' },
          { type: 'scaffold', text: '微观代偿' },
        ],
        intro: '① 引入切片 · 微观本质：原电池驱动力是两极绝对电势差，电子绝不能跨越固液界面进入电解质！',
        core: '② 破局切片 · 电荷守恒：负极失电子积累正电荷，盐桥阴离子必定迁移至负极代偿，维持微观电中性。',
        wrap: '③ 巩固切片 · 总结归纳：“阴移负、阳移正”绝非死背，而是电荷守恒公理之必然。',
      };
    }
  }, [scores, selectedQuestion]);

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 80 }}>
      <div className="app-container" ref={heroRef} style={{ paddingTop: 20 }}>
        
        {/* ====================================================================
            HERO STAGE: 60/40 ASYMMETRIC CLEAN SHOWCASE
            ==================================================================== */}
        <section className="hero-stage-grid" style={{ alignItems: 'center', minHeight: 420 }}>
          
          {/* Left Column (60%): High-Contrast Editorial Typography */}
          <div>
            <div className="gsap-hero-desc" style={{ marginBottom: 12 }}>
              <span className="telemetry-badge">
                <span className="beacon-dot" /> 学情闭环 · 先诊断再合成
              </span>
            </div>

            <h1
              className="gsap-hero-title"
              style={{
                fontSize: 'clamp(2rem, 3.4vw, 2.9rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.035em',
                marginBottom: 16,
                fontWeight: 800,
                color: 'var(--text-main)',
              }}
            >
              看见掌握程度<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                再合成适配的名师
              </span>
            </h1>

            <p
              className="gsap-hero-desc"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-body)',
                lineHeight: 1.7,
                maxWidth: 500,
                marginBottom: 24,
              }}
            >
              多模态感知专注波形，结合 IRT 精准透视薄弱根因，动态合成具备专属解题思维的答疑名师。
            </p>

            <div className="gsap-hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '11px 22px', fontSize: 'var(--text-base)', gap: 8 }}
                onClick={() => onNavigate('collect')}
              >
                开启多模态采集 <ArrowRightIcon size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '11px 20px', fontSize: 'var(--text-base)' }}
                onClick={() => onNavigate('diagnose')}
              >
                查看认知诊断
              </button>
            </div>

            {/* High-Precision Statistics Tickers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
                marginTop: 36,
                paddingTop: 20,
                borderTop: '1px solid var(--border-glass)',
              }}
            >
              <StatItem label="今日专注" unit="分钟" value={String(countFocus)} />
              <StatItem label="已诊断知识点" unit="个" value={String(countKnowledge)} />
              <StatItem label="薄弱待突破" unit="项" value={String(countWeak)} highlight />
            </div>
          </div>

          {/* Right Column (40%): Living Telemetry HUD Card */}
          <div className="gsap-hero-stage">
            <div className="telemetry-hud" ref={hudRef}>
              
              {/* HUD Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`beacon-dot ${isShowingDemo ? 'warning' : 'success'}`} />
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                    {isShowingDemo ? '高三示范学情全景舱' : (getLearnerName() || `学习者 ${getLearnerId()}`)}
                  </span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                    {isShowingDemo ? 'DEMO' : 'LIVE'}
                  </span>
                </div>

                {bound && (
                  <button
                    type="button"
                    onClick={() => setForceDemoMode((prev) => !prev)}
                    style={{
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {isShowingDemo ? '我的学情' : '演示'}
                  </button>
                )}
              </div>

              {/* Sparkline */}
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: 12 }}>
                <FocusSparkline
                  values={samples.length ? samples : DEMO_SAMPLES}
                  height={56}
                  label="生理专注度实时脉冲 (Attention Waveform)"
                  showGlowMarker
                />
              </div>

              {/* Dual Split Middle Section: Knowledge Mastery + Mini Radar Halo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, alignItems: 'center' }}>
                {/* Left: Top 3 Mastery Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeMasteryRows.map(([name, pct]) => {
                    const isWeak = pct < 60;
                    return (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 2 }}>
                          <span style={{ color: isWeak ? '#f59e0b' : 'var(--text-body)', fontWeight: isWeak ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            {isWeak ? '⚠ ' : '✓ '}{name}
                          </span>
                          <span className="tabular-nums" style={{ color: isWeak ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="mastery-track" style={{ height: 4, borderRadius: 2 }}>
                          <div
                            className="gsap-mastery-bar"
                            style={{
                              width: `${pct}%`,
                              background: isWeak
                                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                : 'linear-gradient(90deg, #10b981, #0ea5e9)',
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Mini Radar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-glass)', paddingLeft: 8 }}>
                  <RadarChart5D scores={scores} size={110} showLabels={false} highlightColor="var(--accent-primary)" />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>
                    基因拟合度 <strong style={{ color: 'var(--accent-primary)' }}>92%</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(37, 99, 235, 0.06)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-body)' }}>
                  已锁定 <strong style={{ color: 'var(--accent-primary)' }}>圆锥曲线</strong> 薄弱考点
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  onClick={() =>
                    onNavigate('compose', {
                      weakKnowledge: ['圆锥曲线离心率与渐近线'],
                    })
                  }
                >
                  据此合成名师
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            THE 4-PHASE CLOSED LOOP: TIMELINE STAGE & MORPHING LENS
            ==================================================================== */}
        <section className="timeline-stage-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <span className="telemetry-badge" style={{ marginBottom: 4 }}>时序闭环演进</span>
              <h2 style={{ fontSize: 'var(--text-xl)', letterSpacing: '-0.03em', margin: '4px 0 0', fontWeight: 800 }}>
                四步闭环演进全景
              </h2>
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              轻触节点即时演化各阶段实测场景
            </span>
          </div>

          {/* Top Progressive Capsule Bar */}
          <div className="timeline-capsule-bar">
            {TIMELINE_PHASES.map((p, idx) => {
              const isActive = activePhase === idx;
              return (
                <button
                  key={p.phase}
                  type="button"
                  className={`timeline-capsule-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActivePhase(idx)}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6, fontSize: '11px', fontFamily: 'monospace' }}>{p.phase}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Morphing Stage Viewport */}
          <div className="morphing-stage-viewport">
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className={`badge ${TIMELINE_PHASES[activePhase].badgeColor}`}>
                  PHASE {TIMELINE_PHASES[activePhase].phase} · {TIMELINE_PHASES[activePhase].label}
                </span>
                <span className="beacon-dot success" />
              </div>

              <h3 style={{ fontSize: 'var(--text-lg)', margin: '4px 0 6px', fontWeight: 800 }}>
                {TIMELINE_PHASES[activePhase].title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {TIMELINE_PHASES[activePhase].claim}
              </p>
            </div>

            {/* Central Micro-Telemetry Metrics */}
            <div
              style={{
                margin: '18px 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
              }}
            >
              {TIMELINE_PHASES[activePhase].metrics.map((m) => (
                <div key={m.label} style={{ background: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--accent-primary)' }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Bottom CTA Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {TIMELINE_PHASES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhase(i)}
                    style={{
                      width: i === activePhase ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === activePhase ? 'var(--accent-primary)' : 'var(--border-glass)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={`阶段 0${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: 'var(--text-xs)', gap: 6 }}
                onClick={() => onNavigate(TIMELINE_PHASES[activePhase].tab)}
              >
                {TIMELINE_PHASES[activePhase].action} <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================================
            MINIMALIST 5D PEDAGOGICAL WORKBENCH & SLICE DIFF
            ==================================================================== */}
        <section className="workbench-card-minimal">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <SlidersIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, fontWeight: 800 }}>五维教学基因调优台</h2>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                调节教学参数，即时对比名师引导与通用 AI 的思维差距。
              </div>
            </div>
          </div>

          {/* Question Selector Pills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '14px 0 10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 650 }}>学科测试题：</span>
            {PRESET_QUESTIONS.map((q) => {
              const isSelected = selectedQuestion.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={`workbench-question-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setCustomQuestionInput(q.question);
                  }}
                >
                  {q.topic} · {q.title}
                </button>
              );
            })}
          </div>

          {/* Question input */}
          <input
            type="text"
            value={customQuestionInput}
            onChange={(e) => setCustomQuestionInput(e.target.value)}
            className="input-luxury"
            placeholder="自定义提问..."
            style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 'var(--text-xs)', marginBottom: 18 }}
          />

          {/* Top Tuning Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28, alignItems: 'center' }}>
            {/* Sliders */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>参数微调</span>
                {/* 3 Quick Presets */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.60, method: 0.62, strengths: 0.70, personality: 0.95, communication: 0.65 })}
                  >
                    🎯 启发型
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.96, method: 0.94, strengths: 0.95, personality: 0.68, communication: 0.92 })}
                  >
                    ⚡ 压轴型
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.75, method: 0.80, strengths: 0.98, personality: 0.88, communication: 0.78 })}
                  >
                    🌿 速通型
                  </button>
                </div>
              </div>

              {([
                ['style', '上课风格'],
                ['method', '教学方法'],
                ['strengths', '核心特长'],
                ['personality', '互动温度'],
                ['communication', '表达节奏'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 48px',
                    gap: 12,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={Math.round(scores[key] * 100)}
                    onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) / 100 }))}
                    className="tactile-range-input"
                  />
                  <span className="tabular-nums" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 'var(--text-xs)', textAlign: 'right' }}>
                    {Math.round(scores[key] * 100)}%
                  </span>
                </label>
              ))}
            </div>

            {/* Radar and CTA */}
            <div
              style={{
                borderLeft: '1px solid var(--border-glass)',
                paddingLeft: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <RadarChart5D scores={scores} size={150} showLabels highlightColor="var(--accent-primary)" />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent-primary)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}
              >
                {archetype}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: 180, padding: '7px 14px', fontSize: 'var(--text-xs)' }}
                onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
              >
                以此基因合成名师 <ArrowRightIcon size={12} />
              </button>
            </div>
          </div>

          {/* 3-Step Slice Diff Engine */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                思维切片实时差分 (Side-by-Side Slices)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                随上方滑块实时自适应
              </span>
            </div>

            <div className="diff-slice-grid">
              {/* Left Pane: Master Teacher Slices */}
              <div className="diff-slice-pane diff-slice-pane--primary">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-blue">专属定制名师</span>
                      <strong style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{archetype}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {masterSlices.tags.map((t) => (
                        <span key={t.text} className={`diff-tag-${t.type}`} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 3 }}>
                          {t.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="diff-slice-item diff-slice-item--master">
                    {masterSlices.intro}
                  </div>
                  <div className="diff-slice-item diff-slice-item--master">
                    {masterSlices.core}
                  </div>
                  <div className="diff-slice-item diff-slice-item--master">
                    {masterSlices.wrap}
                  </div>
                </div>

                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>参数已联动</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                  >
                    注入名师工坊
                  </button>
                </div>
              </div>

              {/* Right Pane: Baseline AI Slices */}
              <div className="diff-slice-pane">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>通用基准 AI (未定制)</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>对照组</span>
                  </div>

                  <div className="diff-slice-item diff-slice-item--baseline">
                    {selectedQuestion.baselineSlices.intro}
                  </div>
                  <div className="diff-slice-item diff-slice-item--baseline">
                    {selectedQuestion.baselineSlices.core}
                  </div>
                  <div className="diff-slice-item diff-slice-item--baseline">
                    {selectedQuestion.baselineSlices.wrap}
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: '10px', color: 'var(--text-muted)' }}>
                  ⚠ 痛点：直接灌输结论，无法建立思维台阶。
                </div>
              </div>
            </div>
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
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
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
    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-body)', marginTop: 2 }}>
      {label}
    </div>
  </div>
);
