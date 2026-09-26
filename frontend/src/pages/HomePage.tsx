import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadarChart5D } from '../components/RadarChart5D';
import { FocusSparkline } from '../components/FocusSparkline';
import {
  ArrowRightIcon,
  SlidersIcon,
  SparklesIcon,
  CheckIcon,
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

const PIPELINE_STEPS = [
  {
    no: '01',
    title: '多模态采集',
    subtitle: '多维学情感知',
    desc: '摄像头微晶准星遥测专注波形、行为中断频次与解题文本难点解构。',
    tab: 'collect',
    action: '进入采集工作台',
    icon: VideoCameraIcon,
    metrics: [
      { label: '面部视线凝视追踪', val: '60 fps 实时' },
      { label: '行为中断检测灵敏度', val: '98.4%' },
      { label: '生理专注脉冲拟合', val: '实时同态滤波' },
    ],
  },
  {
    no: '02',
    title: '认知诊断',
    subtitle: '潜能与错因透视',
    desc: 'IRT 项目反应理论计算 Theta 潜能，定位知识盲区与病理错因特征。',
    tab: 'diagnose',
    action: '查看深度认知诊断',
    icon: SearchIcon,
    metrics: [
      { label: 'IRT 能力参数 Theta (θ)', val: '+1.42 (优良)' },
      { label: '高考核心考点覆盖', val: '18 个全维图谱' },
      { label: '薄弱根因溯源', val: '双曲渐近线概念混淆' },
    ],
  },
  {
    no: '03',
    title: '名师合成',
    subtitle: '五维基因重组',
    desc: '调配风格、方法、特长、温度与节奏，一键生成专属个性化答疑名师。',
    tab: 'library',
    action: '探索名师智库',
    icon: DnaIcon,
    metrics: [
      { label: '五维基因调优自由度', val: '5 个微调触点' },
      { label: '教学流派推导算法', val: '多维向量空间投影' },
      { label: '专属教学 Prompt 引擎', val: '动态注入 IRT 参数' },
    ],
  },
  {
    no: '04',
    title: '微课与数字人',
    subtitle: '视听交互呈现',
    desc: '超拟真数字人即时讲解答疑，将抽象推演化为生动的互动微课教学。',
    tab: 'studio',
    action: '前往微课与数字人',
    icon: GraduationCapIcon,
    metrics: [
      { label: '数字人超拟真度', val: '4K 唇形同步' },
      { label: '板书动态具象化', val: '分步公式几何推演' },
      { label: '实时双向答疑延迟', val: '< 650 ms' },
    ],
  },
];

const DEMO_SAMPLES = [68, 72, 70, 76, 84, 82, 89, 94, 91, 95];
const DEMO_COGNITIVE_SAMPLES = [45, 52, 48, 60, 58, 64, 70, 68, 72, 65];

const DEMO_MASTERY: Array<[string, number]> = [
  ['圆锥曲线离心率与渐近线', 42],
  ['立体几何二面角法向量', 55],
  ['导数极值与隐零点代换', 88],
  ['复数模长与几何意义', 94],
  ['三角恒等变换与辅助角', 92],
];

interface PresetQuestion {
  id: string;
  topic: string;
  title: string;
  question: string;
  defaultResponse: string;
}

const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'phys-lenz',
    topic: '高中物理 · 电磁感应',
    title: '楞次定律“增反减同”直观理解',
    question: '楞次定律中的“增反减同”口诀到底怎么从本质能量角度直观理解？每次做右手螺旋和右手定则都会搞混。',
    defaultResponse: '楞次定律内容：感应电流具有这样的方向，即感应电流的磁场总要阻碍引起感应电流的磁通量的变化。口诀为增反减同、来拒去留。做题时先判断原磁场方向，再根据磁通量增减判断感应磁场方向，最后用安培右手定则判断电流方向。',
  },
  {
    id: 'math-derivative',
    topic: '高三数学 · 导数压轴',
    title: '导数隐零点代换破局策略',
    question: '导数大题求单调性或最值时，导函数 $f\'(x)=0$ 的根解不出来（隐零点 $x_0$），怎么化简原式并消除高次项？',
    defaultResponse: '隐零点问题解法：设导数零点为 x0，则满足 f\'(x0)=0。利用该方程将原函数 f(x0) 中的超越式或指数对数用代数多项式替换，降次化简后再求最值。注意零点存在性定理证明区间。',
  },
  {
    id: 'chem-galvanic',
    topic: '高中化学 · 电化学基础',
    title: '原电池电极电势与电子流向',
    question: '在盐桥原电池中，阳离子往正极移还是负极移？为什么外电路是电子移动而内电路是离子定向移动？',
    defaultResponse: '原电池中负极失电子发生氧化反应，正极得电子发生还原反应。外电路电子从负极流向正极。内电路盐桥中阴离子移向负极，阳离子移向正极，形成闭合回路维持电中性。',
  },
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [forceDemoMode, setForceDemoMode] = useState(false);

  // 4-Phase Closed-Loop Stepper active index
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // 5D Pedagogical Workbench state
  const [selectedQuestion, setSelectedQuestion] = useState<PresetQuestion>(PRESET_QUESTIONS[0]);
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
    if (isShowingDemo) {
      return DEMO_MASTERY;
    }
    if (!diagnosis || !Object.keys(diagnosis.knowledgeMastery).length) {
      return DEMO_MASTERY;
    }
    return Object.entries(diagnosis.knowledgeMastery)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
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

  // Dynamic contrast answer generator for the Workbench
  const dynamicDiffAnswer = useMemo(() => {
    const isSocratic = scores.style < 0.75 || scores.method < 0.75;
    const isRigorous = scores.style >= 0.85;
    const isEmpathetic = scores.personality >= 0.85;
    const isHighStrength = scores.strengths >= 0.90;

    if (selectedQuestion.id === 'phys-lenz') {
      return {
        tags: [
          isSocratic ? { type: 'socratic', text: '启发式支架反问' } : null,
          isRigorous ? { type: 'axiom', text: '能量守恒公理闭环' } : null,
          isEmpathetic ? { type: 'scaffold', text: '认知台阶拆解' } : null,
          isHighStrength ? { type: 'axiom', text: '高维物理建模' } : null,
        ].filter(Boolean) as Array<{ type: string; text: string }>,
        lead: isEmpathetic
          ? '别慌！很多同学刚接触电磁感应时都被各种定则绕晕了。其实只要抓住“宇宙最不情愿的事”——它本质上是自然界的“抗拒反应”。'
          : '理解楞次定律切忌死记硬背定则，我们必须从热力学第一定律与能量守恒的公理基石来解构。',
        corePoints: [
          isSocratic
            ? '思考一个问题：如果磁铁靠近线圈时，线圈产生吸引力（顺从它），会发生什么？磁铁会自动加速吸进去，不用外力就能无限产生电能——这违反了什么定律？对，能量守恒！'
            : '推导公理：设外磁场穿过闭合线圈磁通量为 Φ。若 dΦ/dt > 0（磁通增加），感应电流产生的次级磁通量必须满足 Φ_ind < 0，从而对抗机械动能输入。',
          isHighStrength
            ? '破局巧径：“来拒去留”与“增反减同”是同一物理实在的两个投影。当外力强行做功（增），系统必产生反抗力阻碍；当机械分离（减），系统产生吸力挽留。'
            : '具体解题三步法：① 标定原磁场 B_0 方向；② 判断 ΔΦ 符号；③ 判定 B_ind 并用安培右手螺旋一锤定音。',
        ],
        summary: isSocratic
          ? '现在你来试一下：如果把一块强磁铁自由落体穿过铜管，它的加速度会大于 g 还是小于 g？为什么？'
          : '结论：牢记机械功向电能转化的抗阻本质，凡是出现阻碍运动与通量变化的，皆为楞次定律之刚性约束。',
      };
    } else if (selectedQuestion.id === 'math-derivative') {
      return {
        tags: [
          isRigorous ? { type: 'axiom', text: '零点存在性定理证明' } : null,
          isHighStrength ? { type: 'axiom', text: '同构降次与主元消去' } : null,
          isSocratic ? { type: 'socratic', text: '引申设而不求思维' } : null,
          isEmpathetic ? { type: 'scaffold', text: '分步给分踩点策略' } : null,
        ].filter(Boolean) as Array<{ type: string; text: string }>,
        lead: isRigorous
          ? '导数压轴题中的隐零点是高考命题人的杀手锏。其本质在于“设而不求”与“同构消元”。'
          : '不要被解不出的零点吓退！高考导数考的不是解超越方程的能力，而是利用“等量代换”把未知根锁死。',
        corePoints: [
          '第一步（锁定区间）：严格用零点存在性定理证明存在唯一 x0 ∈ (a, b)，使得 f\'(x0) = 0，切记写出单调性。',
          '第二步（核心代换）：由 f\'(x0) = 0 得到超越等式（如 e^x0 = 1/x0 或 ln x0 = -x0），将原函数 f(x0) 中的指数/对数项整体替换为代数式。',
          isHighStrength
            ? '高维降维：代换后原目标函数转化为仅含 x0 的简单一次或分式函数 g(x0)，直接在 x0 ∈ (a, b) 范围求值域即可！'
            : '常规验证：代换后注意构造新函数 g(x)，注意新定义域受限于 x0 的先验范围。',
        ],
        summary: '名师提醒：在考场上写出“令 f\'(x0)=0”这一句即可拿到关键步骤分，这是压轴大题拉开 10 分差距的灵魂技能。',
      };
    } else {
      return {
        tags: [
          { type: 'axiom', text: '氧化还原电对电势' },
          isSocratic ? { type: 'socratic', text: '微观电荷平衡追问' } : { type: 'scaffold', text: '微粒定向迁移建模' },
        ],
        lead: '原电池的本质是将自发氧化还原反应的化学能转化为电能，其驱动力是正负电极之间绝对电势差。',
        corePoints: [
          '电荷守恒原理：外电路依靠自由电子定向移动导电，但电子绝不能跨越固液界面进入电解质溶液！',
          '盐桥离子代偿：内电路依靠阴阳离子迁移导电。负极失去电子积累正电荷，盐桥中阴离子（Cl-）必然向负极移动维持电中性；正极消耗阳离子，盐桥阳离子（K+）必定奔赴正极补足电荷。',
        ],
        summary: '口诀记忆：“阴移负，阳移正”，这绝不是死记硬背，而是微观体系电中性守恒的公理必然。',
      };
    }
  }, [scores, selectedQuestion]);

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 96 }}>
      <div className="app-container" ref={heroRef} style={{ paddingTop: 24 }}>
        
        {/* ====================================================================
            HERO STAGE: 60/40 ASYMMETRIC CINEMATIC SHOWCASE (Apple/Linear Style)
            ==================================================================== */}
        <section className="hero-stage-grid" style={{ alignItems: 'center', minHeight: 460 }}>
          
          {/* Left Column (60%): High-Contrast Editorial Typography */}
          <div>
            <div className="gsap-hero-desc" style={{ marginBottom: 14 }}>
              <span className="telemetry-badge">
                <span className="beacon-dot" /> 学情闭环 · 先诊断再合成
              </span>
            </div>

            <h1
              className="gsap-hero-title"
              style={{
                fontSize: 'clamp(2rem, 3.6vw, 3rem)',
                lineHeight: 1.16,
                letterSpacing: '-0.035em',
                marginBottom: 18,
                fontWeight: 800,
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
                lineHeight: 1.75,
                maxWidth: 540,
                marginBottom: 28,
              }}
            >
              告别通用大模型的千人一面。系统通过多模态感知捕捉专注波形，结合 IRT 认知诊断精准定位薄弱根因，动态合成具备独特教学风格与解题基因的专属名师。
            </p>

            <div className="gsap-hero-cta" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: 'var(--text-base)', gap: 8 }}
                onClick={() => onNavigate('collect')}
              >
                开启多模态采集 <ArrowRightIcon size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '12px 22px', fontSize: 'var(--text-base)' }}
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
                gap: 24,
                marginTop: 44,
                paddingTop: 24,
                borderTop: '1px solid var(--border-glass)',
              }}
            >
              <StatItem
                label="今日专注时长"
                unit="分钟"
                value={String(countFocus)}
                detail="多模态遥测累计"
              />
              <StatItem
                label="已诊断知识点"
                unit="个"
                value={String(countKnowledge)}
                detail="覆盖高考核心图谱"
              />
              <StatItem
                label="薄弱待突破"
                unit="项"
                value={String(countWeak)}
                detail="已生成专属名师方案"
                highlight
              />
            </div>
          </div>

          {/* Right Column (40%): Living Cognitive Telemetry HUD Card */}
          <div className="gsap-hero-stage">
            <div className="telemetry-hud" ref={hudRef}>
              
              {/* HUD Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`beacon-dot ${isShowingDemo ? 'warning' : 'success'}`} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isShowingDemo ? '高三示范学情全景舱' : (getLearnerName() || `学习者 ${getLearnerId()}`)}
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                        {isShowingDemo ? 'DEMO' : 'LIVE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {isShowingDemo ? '生理波形、考点薄弱度与名师基因三维联动' : (diagnosis?.diagnosedAt ? `最近诊断 ${diagnosis.diagnosedAt}` : '实时监测中')}
                    </div>
                  </div>
                </div>

                {/* State Switcher Toggle */}
                {bound && (
                  <button
                    type="button"
                    onClick={() => setForceDemoMode((prev) => !prev)}
                    style={{
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {isShowingDemo ? '切回我的学情' : '查看演示'}
                  </button>
                )}
              </div>

              {/* Dual-Waveform Sparkline: Attention Pulse */}
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: 14 }}>
                <FocusSparkline
                  values={samples.length ? samples : DEMO_SAMPLES}
                  height={64}
                  label="生理专注度实时脉冲 (Attention Waveform)"
                  showGlowMarker
                />
              </div>

              {/* Dual Split Middle Section: Knowledge Mastery + Mini Radar Halo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, alignItems: 'center' }}>
                {/* Left Mini-Card: Top Mastery Matrix */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>薄弱攻坚知识点</span>
                    <span>指数</span>
                  </div>
                  {activeMasteryRows.slice(0, 3).map(([name, pct]) => {
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

                {/* Right Mini-Card: 5D Radar Holographic Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-glass)', paddingLeft: 10 }}>
                  <RadarChart5D scores={scores} size={118} showLabels={false} highlightColor="var(--accent-primary)" />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>
                    名师基因拟合度 <strong style={{ color: 'var(--accent-primary)' }}>92%</strong>
                  </div>
                </div>
              </div>

              {/* Weak Knowledge Prescription Action Banner */}
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--accent-primary)', display: 'block' }}>薄弱攻坚锁定</strong>
                  已锁定圆锥曲线与立体几何盲区
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', flexShrink: 0 }}
                  onClick={() =>
                    onNavigate('compose', {
                      weakKnowledge: ['圆锥曲线离心率与渐近线', '立体几何二面角法向量'],
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
            THE 4-PHASE CLOSED-LOOP PIPELINE (Left Stepper + Right Canvas)
            ==================================================================== */}
        <section style={{ marginTop: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <span className="telemetry-badge" style={{ marginBottom: 6 }}>闭环链路</span>
              <h2 style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', margin: 0, fontWeight: 700 }}>
                四步闭环：从生理遥测到名师数字人
              </h2>
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              点击步骤可在右侧视窗即刻透视该阶段实测数据
            </span>
          </div>

          {/* Stepper Track & Dynamic Canvas Container */}
          <div className="loop-stepper-container">
            {/* Left Column: 4-Phase Stepper Rail */}
            <div className="loop-stepper-nav">
              {PIPELINE_STEPS.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                const IconComponent = step.icon;
                return (
                  <button
                    key={step.no}
                    type="button"
                    className={`loop-step-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveStepIndex(idx)}
                  >
                    <span className="loop-step-num">{step.no}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: isActive ? 'var(--text-main)' : 'var(--text-body)' }}>
                          {step.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                          {step.subtitle}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Dynamic Live Showcase Canvas */}
            <div className="loop-canvas">
              {/* Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="telemetry-badge">
                      阶段 {PIPELINE_STEPS[activeStepIndex].no} 实测引擎
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {PIPELINE_STEPS[activeStepIndex].subtitle}
                    </span>
                  </div>
                  <span className="beacon-dot success" />
                </div>

                <h3 style={{ fontSize: 'var(--text-xl)', margin: '4px 0 8px', fontWeight: 800 }}>
                  {PIPELINE_STEPS[activeStepIndex].title} · 实时工程透视
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                  {PIPELINE_STEPS[activeStepIndex].desc}
                </p>
              </div>

              {/* Dynamic Interior Visualization */}
              <div
                style={{
                  margin: '20px 0',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 650, letterSpacing: '0.04em' }}>
                  关键遥测指标与运行基准 (LIVE TELEMETRY)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {PIPELINE_STEPS[activeStepIndex].metrics.map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--accent-primary)' }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  学情数据与名师基因在全系统中保持毫秒级单向流驱动
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ gap: 8 }}
                  onClick={() => onNavigate(PIPELINE_STEPS[activeStepIndex].tab)}
                >
                  {PIPELINE_STEPS[activeStepIndex].action} <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            5D PEDAGOGICAL WORKBENCH & REAL-TIME ANSWER DIFF COMPARISON
            ==================================================================== */}
        <section className="workbench-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <SlidersIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0, fontWeight: 800 }}>五维教学基因调优与回答对比工作台</h2>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                自由微调教学参数，实时检验名师回答在【启发度、严谨度、追问逻辑】上的本质差距
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)', margin: '10px 0 20px', lineHeight: 1.6 }}>
            名师不是固化的提示词模板，而是由风格、方法、特长、温度与节奏构成的连续参数空间。选择或输入一道学科难点，滑动下方五维旋钮，即可在下方双轨视窗中实时看到个性化名师与通用 AI 的回答差距。
          </p>

          {/* Preset Questions Row */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 650, marginBottom: 8 }}>
              快捷学科难题预设：
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          </div>

          {/* Question Input Box */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-body)', marginBottom: 6 }}>
              当前测试提问：
            </label>
            <input
              type="text"
              value={customQuestionInput}
              onChange={(e) => setCustomQuestionInput(e.target.value)}
              className="input-luxury"
              placeholder="在此输入您的提问，或选择上方预设题..."
              style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Top Tuning Grid: Left Sliders, Right Archetype & Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, alignItems: 'center' }}>
            {/* Left: 5 Tactile Range Sliders + Presets */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)' }}>五维教学基因触觉微调</span>
                {/* Archetype Quick Presets */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.60, method: 0.62, strengths: 0.70, personality: 0.95, communication: 0.65 })}
                  >
                    🎯 苏格拉底启发型
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.96, method: 0.94, strengths: 0.95, personality: 0.68, communication: 0.92 })}
                  >
                    ⚡ 公理严密压轴型
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-glass)', background: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--text-body)' }}
                    onClick={() => setScores({ style: 0.75, method: 0.80, strengths: 0.98, personality: 0.88, communication: 0.78 })}
                  >
                    🌿 化简速通破局型
                  </button>
                </div>
              </div>

              {([
                ['style', '上课风格', '启发引导', '严密推演'],
                ['method', '教学方法', '追问探究', '压轴陷阱'],
                ['strengths', '核心特长', '化简速通', '高维建模'],
                ['personality', '互动温度', '亲切鼓励', '沉稳严谨'],
                ['communication', '表达节奏', '循序铺垫', '纲举目张'],
              ] as const).map(([key, label, low, high]) => (
                <label
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 54px',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-main)' }}>{label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{low} ↔ {high}</span>
                  </span>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={Math.round(scores[key] * 100)}
                    onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) / 100 }))}
                    className="tactile-range-input"
                  />
                  <span className="tabular-nums" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 'var(--text-sm)', textAlign: 'right' }}>
                    {Math.round(scores[key] * 100)}%
                  </span>
                </label>
              ))}
            </div>

            {/* Right: Radar Chart + Archetype Badge */}
            <div
              style={{
                borderLeft: '1px solid var(--border-glass)',
                paddingLeft: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
              }}
            >
              <div style={{ position: 'relative' }}>
                <RadarChart5D scores={scores} size={200} showLabels highlightColor="var(--accent-primary)" />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>推导名师教学流派</div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 'var(--text-base)',
                    color: 'var(--accent-primary)',
                    padding: '6px 18px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {archetype}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: 220, padding: '10px 16px', fontSize: 'var(--text-sm)' }}
                onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
              >
                以此基因合成名师 <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>

          {/* ====================================================================
              DUAL-TRACK LIVE ANSWER DIFF COMPARISON ENGINE
              ==================================================================== */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="telemetry-badge" style={{ marginBottom: 4 }}>实时差分透视</span>
                <h3 style={{ fontSize: 'var(--text-lg)', margin: '4px 0 0', fontWeight: 800 }}>
                  参数调优回答对比：个性化名师 vs 通用基准 AI
                </h3>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                微调滑块将实时改变左侧回答的教学法结构
              </span>
            </div>

            <div className="workbench-diff-grid">
              {/* Left Pane: Customized Master Teacher Response */}
              <div className="diff-pane diff-pane--primary">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-blue">专属定制名师</span>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)' }}>{archetype}</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>动态教学法生效中</span>
                  </div>

                  {/* Diff Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {dynamicDiffAnswer.tags.map((tag) => (
                      <span key={tag.text} className={`diff-tag-${tag.type}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 700 }}>
                        {tag.text}
                      </span>
                    ))}
                  </div>

                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: 12, fontWeight: 550 }}>
                    {dynamicDiffAnswer.lead}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {dynamicDiffAnswer.corePoints.map((point, i) => (
                      <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.6, paddingLeft: 10, borderLeft: '2px solid var(--accent-primary)' }}>
                        {point}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', lineHeight: 1.5 }}>
                    💡 {dynamicDiffAnswer.summary}
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已根据当前 5D 参数实时适配</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                  >
                    注入名师工坊
                  </button>
                </div>
              </div>

              {/* Right Pane: Standard Baseline AI Response */}
              <div className="diff-pane">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>通用基准 AI</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>标准未定制模型</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>对照基准</span>
                  </div>

                  {/* Generic Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="diff-tag-generic" style={{ padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      直给公式结论
                    </span>
                    <span className="diff-tag-generic" style={{ padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      无认知支架
                    </span>
                    <span className="diff-tag-generic" style={{ padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 600 }}>
                      千人一面
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 12 }}>
                    {selectedQuestion.defaultResponse}
                  </p>

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-glass)', lineHeight: 1.6 }}>
                    ⚠ 痛点诊断：传统通用大模型直接照搬教案条目，学生遇到变形题依然不会举一反三；而上方左侧名师能根据学生的基因参数，智能选择“苏格拉底反问”、“公理证明”或“化简速通”，实现真正的因材施教。
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>基准无个性化调优</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; unit: string; value: string; detail: string; highlight?: boolean }> = ({
  label,
  unit,
  value,
  detail,
  highlight,
}) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span
        className="stat-figure tabular-nums"
        style={{
          fontSize: 'var(--text-3xl)',
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
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
      {detail}
    </div>
  </div>
);
