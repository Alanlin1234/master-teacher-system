import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadarChart5D } from '../components/RadarChart5D';
import { FocusSparkline } from '../components/FocusSparkline';
import { ArrowRightIcon, SlidersIcon } from '../components/Icons';
import { useCountUp, useHeroEntrance, useMasteryReveal } from '../lib/gsap';
import { monitorApi } from '../services/eduApi';
import { getLearnerId, getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; teacherSection?: string }) => void;
}

const STEPS = [
  { no: '01', title: '采集', body: '学习监控、感知数据、内容分析。', tab: 'collect', link: '进入采集' },
  { no: '02', title: '诊断', body: '掌握度、错因、能力水平。', tab: 'diagnose', link: '查看诊断' },
  { no: '03', title: '名师', body: '智库、五维合成、一对一伴学。', tab: 'library', link: '进入名师' },
  { no: '04', title: '呈现', body: '微课与数字人。', tab: 'studio', link: '去呈现' },
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const masteryRef = useRef<HTMLDivElement>(null);
  const [learnerTick, setLearnerTick] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [loadError, setLoadError] = useState('');

  useHeroEntrance(heroRef);

  useEffect(() => {
    const id = getLearnerId();
    setDiagnosis(readDiagnosis());
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
      setFocusMinutes(typeof seconds === 'number' ? Math.round(seconds / 60) : null);
      const scores: number[] = [];
      (sessions.sessions || []).forEach((session) => {
        (session.attention_data || []).forEach((point) => {
          if (typeof point.score === 'number') scores.push(point.score);
        });
      });
      setSamples(scores.slice(-12));
    }).catch(() => {
      if (!cancelled) setLoadError('学情接口暂时没有返回。请确认 8000 后端已启动，并已绑定学习者。');
    });
    return () => { cancelled = true; };
  }, [learnerTick]);

  const masteryRows = useMemo(() => {
    if (!diagnosis) return [];
    return Object.entries(diagnosis.knowledgeMastery)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
  }, [diagnosis]);

  useMasteryReveal(masteryRef, masteryRows.map((row) => row[0]).join('|'));

  const knowledgeCount = diagnosis ? Object.keys(diagnosis.knowledgeMastery).length : null;
  const weakCount = diagnosis ? diagnosis.weakCount : null;
  const countFocus = useCountUp(focusMinutes ?? 0, 1.2, focusMinutes != null);
  const countKnowledge = useCountUp(knowledgeCount ?? 0, 1.2, knowledgeCount != null);
  const countWeak = useCountUp(weakCount ?? 0, 1.2, weakCount != null);

  const [scores, setScores] = useState({
    style: 0.94,
    personality: 0.88,
    strengths: 0.96,
    method: 0.92,
    communication: 0.86,
  });

  const archetype = scores.style >= 0.82 && scores.method >= 0.82
    ? '公理严密 · 高考压轴'
    : scores.style < 0.82 && scores.method < 0.82
      ? '启发引导 · 递进追问'
      : '混合教学基因';

  const bound = getLearnerId() != null;

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 88 }}>
      <div className="app-container" ref={heroRef}>
        <section className="hero-stage-grid">
          <div>
            <div className="gsap-hero-desc" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-primary)', marginBottom: 18 }}>
              学情闭环 · 先诊断再合成
            </div>
            <h1 className="gsap-hero-title" style={{ fontSize: 'var(--text-3xl)', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 18 }}>
              看见掌握程度<br />
              <span style={{ color: 'var(--accent-primary)' }}>再合成适配的老师</span>
            </h1>
            <p className="gsap-hero-desc" style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 1.7, maxWidth: 520, marginBottom: 28 }}>
              先用多模态方式记下专注、感知和学习内容，再判断知识点掌握到哪一步，然后才进入名师合成与数字人呈现。
            </p>
            <div className="gsap-hero-cta" style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('collect')}>
                开始采集 <ArrowRightIcon size={16} />
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('diagnose')}>
                查看诊断
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-glass)' }}>
              <Stat label="今日专注（分钟）" value={focusMinutes == null ? '—' : String(countFocus)} />
              <Stat label="已诊断知识点" value={knowledgeCount == null ? '—' : String(countKnowledge)} />
              <Stat label="薄弱点数" value={weakCount == null ? '—' : String(countWeak)} />
            </div>
          </div>

          <div className="gsap-hero-stage insight-panel" ref={masteryRef}>
            {!bound ? (
              <>
                <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.6 }}>绑定学习者并完成一次采集后，这里显示专注曲线和掌握度。</p>
                <button type="button" className="btn btn-primary" onClick={() => onNavigate('collect')}>去采集</button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{getLearnerName() || `学习者 ${getLearnerId()}`}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {diagnosis?.diagnosedAt ? `最近诊断 ${diagnosis.diagnosedAt}` : '还没有诊断记录'}
                    </div>
                  </div>
                  <span className="status-beacon" style={{ background: diagnosis ? '#059669' : '#d97706' }} />
                </div>
                <FocusSparkline values={samples} />
                <div className="insight-split" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {masteryRows.length === 0 && (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>完成诊断后显示最多 5 个知识点。</p>
                  )}
                  {masteryRows.map(([name, score]) => {
                    const pct = Math.round(score <= 1 ? score * 100 : score);
                    const weak = pct < 60;
                    return (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                          <span>{name}</span>
                          <span className="tabular-nums" style={{ color: weak ? '#d97706' : 'var(--text-main)' }}>{pct}%</span>
                        </div>
                        <div className="mastery-track">
                          <div className="gsap-mastery-bar" style={{ width: `${pct}%`, background: weak ? '#d97706' : '#059669' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {diagnosis && diagnosis.weakKnowledge.length > 0 && (
                  <div className="weak-banner" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span>薄弱：{diagnosis.weakKnowledge.slice(0, 3).join('、')}</span>
                    <button type="button" className="btn btn-secondary" onClick={() => onNavigate('compose', { weakKnowledge: diagnosis.weakKnowledge })}>
                      据此合成名师
                    </button>
                  </div>
                )}
                {loadError && <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>{loadError}</p>}
              </>
            )}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', marginBottom: 8 }}>四步，从学情到名师</h2>
          <div className="flow-rail">
            {STEPS.map((step) => (
              <article key={step.no} className="flow-step gsap-flow-step">
                <div style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-subtle)', letterSpacing: '-0.03em' }}>{step.no}</div>
                <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{step.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{step.body}</p>
                <button type="button" onClick={() => onNavigate(step.tab)}>{step.link}</button>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 56 }} className="radar-bench-layout gene-preview">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <SlidersIcon size={16} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>五维教学基因预览</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 0 }}>合成前先看教学基因会落在哪一侧。答疑演练在一对一伴学里进行。</p>
            {([
              ['style', '上课风格', '启发引导', '严密推演'],
              ['method', '教学方法', '追问探究', '压轴陷阱'],
              ['strengths', '核心特长', '化简速通', '高维建模'],
              ['personality', '互动温度', '亲切鼓励', '沉稳严谨'],
              ['communication', '表达节奏', '循序铺垫', '纲举目张'],
            ] as const).map(([key, label, low, high]) => (
              <label key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <span>
                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 650 }}>{label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{low} ↔ {high}</span>
                </span>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={Math.round(scores[key] * 100)}
                  onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) / 100 }))}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="tabular-nums" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{Math.round(scores[key] * 100)}%</span>
              </label>
            ))}
          </div>
          <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RadarChart5D scores={scores} size={200} showLabels highlightColor="var(--accent-primary)" />
            <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{archetype}</div>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('compose')}>去合成</button>
          </div>
        </section>
        <span style={{ display: 'none' }}>{learnerTick}</span>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="stat-figure">{value}</div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
  </div>
);
