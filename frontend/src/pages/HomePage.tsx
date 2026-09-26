import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadarChart5D } from '../components/RadarChart5D';
import { FocusSparkline } from '../components/FocusSparkline';
import { ArrowRightIcon, SlidersIcon, SparklesIcon, UserIcon, CheckIcon, AlertCircleIcon } from '../components/Icons';
import { useCountUp, useHeroEntrance, useMasteryReveal } from '../lib/gsap';
import { monitorApi } from '../services/eduApi';
import { getLearnerId, getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; teacherSection?: string }) => void;
}

const PIPELINE_STEPS = [
  {
    no: '01',
    title: '多模态采集',
    subtitle: '多维学情感知',
    body: '摄像头微晶准星遥测专注波形、行为中断频次与解题文本难点解构。',
    tab: 'collect',
    action: '进入采集工作台',
  },
  {
    no: '02',
    title: '认知诊断',
    subtitle: '潜能与错因透视',
    body: 'IRT 项目反应理论计算 Theta 潜能，定位知识盲区与病理错因特征。',
    tab: 'diagnose',
    action: '查看认知诊断',
  },
  {
    no: '03',
    title: '名师合成',
    subtitle: '五维基因重组',
    body: '调配风格、方法、特长、温度与节奏，一键生成专属个性化答疑名师。',
    tab: 'library',
    action: '探索名师智库',
  },
  {
    no: '04',
    title: '微课与数字人',
    subtitle: '视听交互呈现',
    body: '超拟真数字人即时讲解答疑，将抽象推演化为生动的互动微课教学。',
    tab: 'studio',
    action: '前往互动呈现',
  },
];

const DEMO_SAMPLES = [68, 72, 70, 76, 84, 82, 89, 94, 91, 95];
const DEMO_MASTERY: Array<[string, number]> = [
  ['圆锥曲线离心率与渐近线', 42],
  ['立体几何二面角法向量', 55],
  ['导数极值与隐零点代换', 88],
  ['复数模长与几何意义', 94],
  ['三角恒等变换与辅助角', 92],
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [learnerTick, setLearnerTick] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [loadError, setLoadError] = useState('');
  const [forceDemoMode, setForceDemoMode] = useState(false);

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
    setLoadError('');
    Promise.all([
      monitorApi.getDashboard(id, id),
      monitorApi.getSessions(id, id),
    ]).then(([dash, sessions]) => {
      if (cancelled) return;
      const seconds = dash.stats?.focus_seconds_today;
      setFocusMinutes(typeof seconds === 'number' ? Math.round(seconds / 60) : 48);
      const scores: number[] = [];
      (sessions.sessions || []).forEach((session) => {
        (session.attention_data || []).forEach((point) => {
          if (typeof point.score === 'number') scores.push(point.score);
        });
      });
      setSamples(scores.length > 2 ? scores.slice(-12) : DEMO_SAMPLES);
    }).catch(() => {
      if (!cancelled) {
        // Fallback gracefully without breaking display
        setFocusMinutes(48);
        setSamples(DEMO_SAMPLES);
      }
    });

    return () => { cancelled = true; };
  }, [learnerTick]);

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

  // 5D Pedagogical Genes Bench
  const [scores, setScores] = useState({
    style: 0.94,
    personality: 0.88,
    strengths: 0.96,
    method: 0.92,
    communication: 0.86,
  });

  const archetype = useMemo(() => {
    if (scores.style >= 0.85 && scores.method >= 0.85) return '公理严密 · 高考压轴型';
    if (scores.style < 0.75 && scores.personality >= 0.85) return '启发递进 · 温情伴学型';
    if (scores.strengths >= 0.9) return '高维建模 · 穿透核心型';
    return '多维平衡 · 全景解析型';
  }, [scores]);

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 96 }}>
      <div className="app-container" ref={heroRef} style={{ paddingTop: 24 }}>
        
        {/* ====================================================================
            HERO STAGE: 60/40 ASYMMETRIC CINEMATIC SHOWCASE
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

          {/* Right Column (40%): Living Telemetry HUD Card */}
          <div className="gsap-hero-stage">
            <div className="telemetry-hud" ref={hudRef}>
              
              {/* HUD Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`beacon-dot ${isShowingDemo ? 'warning' : 'success'}`} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isShowingDemo ? '高三示范学情遥测' : (getLearnerName() || `学习者 ${getLearnerId()}`)}
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                        {isShowingDemo ? 'DEMO' : 'LIVE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {isShowingDemo ? '实时模拟生理波形与掌握度' : (diagnosis?.diagnosedAt ? `最近诊断 ${diagnosis.diagnosedAt}` : '实时监测中')}
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

              {/* Real-time Focus Sparkline */}
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: 16 }}>
                <FocusSparkline
                  values={samples.length ? samples : DEMO_SAMPLES}
                  height={68}
                  label="生理专注度实时脉冲 (Attention Waveform)"
                  showGlowMarker
                />
              </div>

              {/* Dynamic Knowledge Mastery Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>核心考点掌握矩阵</span>
                  <span>掌握指数</span>
                </div>
                {activeMasteryRows.map(([name, pct]) => {
                  const isWeak = pct < 60;
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                        <span style={{ color: isWeak ? '#f59e0b' : 'var(--text-body)', fontWeight: isWeak ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          {isWeak ? '⚠ ' : '✓ '}{name}
                        </span>
                        <span className="tabular-nums" style={{ color: isWeak ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="mastery-track" style={{ height: 6, borderRadius: 3 }}>
                        <div
                          className="gsap-mastery-bar"
                          style={{
                            width: `${pct}%`,
                            background: isWeak
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : 'linear-gradient(90deg, #10b981, #0ea5e9)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weak Knowledge Prescription Action Banner */}
              <div
                style={{
                  marginTop: 18,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--accent-primary)', display: 'block' }}>薄弱攻坚推荐</strong>
                  针对圆锥曲线与立体几何，已匹配破局名师
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

              {loadError && (
                <div style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {loadError}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================================
            THE 4-PHASE CLOSED-LOOP LEARNING PIPELINE
            ==================================================================== */}
        <section style={{ marginTop: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <span className="telemetry-badge" style={{ marginBottom: 6 }}>闭环链路</span>
              <h2 style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', margin: 0, fontWeight: 700 }}>
                四步闭环：从生理遥测到名师数字人
              </h2>
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'none' }}>
              点击步骤快速进入对应模块
            </span>
          </div>

          <div className="pipeline-track">
            {PIPELINE_STEPS.map((step) => (
              <div
                key={step.no}
                className="pipeline-card gsap-flow-step"
                onClick={() => onNavigate(step.tab)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="pipeline-card-num">{step.no}</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', opacity: 0.85, fontWeight: 600 }}>
                      {step.subtitle}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', margin: '10px 0 6px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>
                    {step.body}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', fontWeight: 600, marginTop: 12 }}>
                  <span>{step.action}</span>
                  <ArrowRightIcon size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================================
            5D PEDAGOGICAL DNA WORKBENCH & RADAR EXPLORER
            ==================================================================== */}
        <section
          style={{
            marginTop: 72,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
          }}
          className="radar-bench-layout"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <SlidersIcon size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, fontWeight: 700 }}>五维教学基因调优台</h2>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  触觉式微调风格、方法与互动，推导名师教学流派
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)', margin: '12px 0 24px', lineHeight: 1.6 }}>
              名师不是固化的预设提示词，而是由风格、方法、特长、温度与节奏五大参数精准调谐的智能教学体。在此调优参数，点击即可注入名师工坊。
            </p>

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
                  marginBottom: 14,
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

          {/* Right Side: Radar Chart + Archetype Badge */}
          <div
            style={{
              borderLeft: '1px solid var(--border-glass)',
              paddingLeft: 36,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <div style={{ position: 'relative' }}>
              <RadarChart5D scores={scores} size={220} showLabels highlightColor="var(--accent-primary)" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>推导名师流派</div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--text-base)',
                  color: 'var(--accent-primary)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                }}
              >
                {archetype}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: 220, padding: '10px 16px', fontSize: 'var(--text-sm)' }}
              onClick={() => onNavigate('compose', { teacherSection: 'compose' })}
            >
              以当前基因合成名师 <ArrowRightIcon size={14} />
            </button>
          </div>
        </section>

        <span style={{ display: 'none' }}>{learnerTick}</span>
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
