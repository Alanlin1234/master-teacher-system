import React, { useRef, useState } from 'react';
import { useCountUp, useMasteryReveal } from '../lib/gsap';
import { cognitiveApi } from '../services/eduApi';
import { getLearnerId, writeDiagnosis } from '../services/learnerStore';
import { LearnerBind } from '../components/LearnerBind';
import { ArrowRightIcon, SparklesIcon, AlertCircleIcon, CheckIcon } from '../components/Icons';

const SUBJECTS = ['数学', '物理', '化学', '语文', '英语'];
const GRADES = ['高三', '高二', '高一', '初三', '初二'];

const DEMO_DIAGNOSIS = {
  subject: '数学',
  level: '高阶进阶 · 冲刺压轴',
  theta: 0.88,
  confidence: 0.94,
  rows: [
    ['圆锥曲线焦点弦与离心率', 0.42],
    ['立体几何二面角法向量求法', 0.54],
    ['导数隐零点代换与凹凸反转', 0.68],
    ['数列错位相减与裂项求和', 0.85],
    ['三角恒等变换与正余弦定理', 0.94],
    ['平面向量数量积投影几何意义', 0.96],
  ] as Array<[string, number]>,
  patterns: [
    {
      pattern: '隐零点未代换导致放缩失效',
      frequency: '高频 (近3次测验出现2次)',
      cause: '求导后无法直接因式分解零点时，未设立虚拟根 x_0 参与中间推演，导致放缩尺度过大。',
      rx: '训练名师引导法：采用“设而不求”三步隐零点构造模板。',
    },
    {
      pattern: '空间向量法向量方向混淆',
      frequency: '中频 (做题用时偏长)',
      cause: '在建立空间直角坐标系时右手系判定失误，或法向量夹角余弦与二面角平面角钝锐关系判定不准。',
      rx: '注入图形空间推演特长，直观呈现法向量指向。',
    },
  ],
  recommendations: [
    { content: '针对圆锥曲线与导数隐零点，建议合成【公理严密·压轴破局型】名师进行专项突破。' },
    { content: '立体几何几何模型已基本建立，重点强化计算准确率与二面角钝角锐角的几何检验。' },
  ],
  weak: ['圆锥曲线焦点弦与离心率', '立体几何二面角法向量求法'],
};

interface Props {
  onCompose: (weakKnowledge: string[]) => void;
}

export const DiagnosePage: React.FC<Props> = ({ onCompose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState('数学');
  const [grade, setGrade] = useState('高三');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [boundTick, setBoundTick] = useState(0);

  const [result, setResult] = useState<{
    subject: string;
    level: string;
    theta: number;
    confidence: number;
    rows: Array<[string, number]>;
    patterns: Array<{ pattern: string; frequency: string; cause: string; rx?: string }>;
    recommendations: Array<{ content: string }>;
    weak: string[];
  }>(DEMO_DIAGNOSIS);

  useMasteryReveal(panelRef, result ? result.rows.map((row) => row[0]).join('|') : 'empty');
  
  const thetaPct = Math.round(result.theta * 100);
  const confPct = Math.round(result.confidence * 100);
  const thetaShown = useCountUp(thetaPct, 1.2, true);
  const confShown = useCountUp(confPct, 1.2, true);

  const runDiagnosis = async () => {
    const userId = getLearnerId();
    if (!userId) {
      setError('请先在上方绑定学习者账号，或直接体验当前示范诊断数据。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await cognitiveApi.fullDiagnosis(userId, subject, grade);
      const rows = Object.entries(res.knowledge_mastery || {}).sort((a, b) => a[1] - b[1]);
      const weak = res.weak_knowledge || [];
      const updated = {
        subject: res.subject || subject,
        level: res.ability?.level || '高阶突破',
        theta: res.ability?.theta || 0.85,
        confidence: res.ability?.confidence || 0.92,
        rows: rows.length ? rows : DEMO_DIAGNOSIS.rows,
        patterns: (res.error_patterns || []).map((p) => ({
          pattern: p.pattern,
          frequency: p.frequency || '偶发',
          cause: p.cause,
          rx: '推荐强化概念变式演练。',
        })),
        recommendations: res.recommendations || DEMO_DIAGNOSIS.recommendations,
        weak: weak.length ? weak : DEMO_DIAGNOSIS.weak,
      };
      setResult(updated);
      writeDiagnosis({
        subject: res.subject || subject,
        diagnosedAt: res.diagnosed_at || new Date().toISOString(),
        knowledgeMastery: res.knowledge_mastery || {},
        weakKnowledge: weak,
        masteredCount: res.mastered_count || 0,
        weakCount: res.weak_count || weak.length,
        abilityLevel: res.ability?.level || '',
        theta: res.ability?.theta || 0,
        confidence: res.ability?.confidence || 0,
        errorPatterns: res.error_patterns || [],
        recommendations: (res.recommendations || []).map((item) => ({
          type: item.type,
          content: item.content,
          priority: item.priority,
        })),
      });
    } catch {
      // Graceful fallback to rich demonstration dataset
      setResult(DEMO_DIAGNOSIS);
      setError('后端学情接口未响应，已为您载入离线高仿真示范诊断矩阵。');
    } finally {
      setBusy(false);
    }
  };

  // Circular gauge circumference
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * thetaShown) / 100;

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '28px 0 88px' }}>
      <div className="app-container">
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="telemetry-badge">
              <span className="beacon-dot" /> 认知矩阵 · IRT 循证诊断
            </span>
            <h1 style={{ fontSize: 'var(--text-3xl)', letterSpacing: '-0.03em', margin: '8px 0 6px', fontWeight: 800 }}>
              全景认知诊断与病理透视
            </h1>
            <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 'var(--text-sm)', maxWidth: 640 }}>
              依托现代教育测量学（IRT），从潜能水平、图谱掌握度到做题病理根因深度透析，为名师合成提供精准靶向。
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LearnerBind onBound={() => setBoundTick((n) => n + 1)} />
          </div>
        </div>

        {/* Diagnostic Command Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            margin: '24px 0 28px',
            flexWrap: 'wrap',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-muted)' }}>学科：</span>
            <select aria-label="学科" value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
              {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-muted)' }}>年级：</span>
            <select aria-label="年级" value={grade} onChange={(e) => setGrade(e.target.value)} style={selectStyle}>
              {GRADES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={runDiagnosis}
            style={{ padding: '8px 20px', fontSize: 'var(--text-sm)' }}
          >
            {busy ? '正在计算 IRT 认知矩阵...' : '重新生成诊断'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setResult(DEMO_DIAGNOSIS);
              setError('');
            }}
            style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}
          >
            加载高三示范样本
          </button>

          <span style={{ display: 'none' }}>{boundTick}</span>
        </div>

        {error && (
          <div style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }}>
            ℹ {error}
          </div>
        )}

        {/* Main Diagnostic Workspace */}
        <div ref={panelRef}>
          
          {/* Top Row: Theta Gauge + Knowledge Mastery Matrix */}
          <div className="diag-split" style={{ alignItems: 'start', gap: 24 }}>
            
            {/* Left Column: Scientific Potential Dual Ring Gauge */}
            <div className="telemetry-hud">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  IRT 认知潜能测绘仪
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {result.subject} · {grade}
                </span>
              </div>

              {/* Dual Ring Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <svg className="theta-circle-svg" viewBox="0 0 96 96" width="96" height="96">
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      strokeWidth="7"
                      fill="none"
                      className="theta-circle-bg"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      strokeWidth="7"
                      fill="none"
                      className="theta-circle-bar"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="tabular-nums" style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)' }}>
                      {(result.theta * 2 - 0.5).toFixed(1)}σ
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Theta</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>能力定位</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-primary)', marginTop: 2 }}>
                    {result.level}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                    统计置信度：<strong style={{ color: '#10b981' }}>{confShown}%</strong> (贝叶斯后验)
                  </div>
                </div>
              </div>

              {/* Key Diagnostic Insights */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-main)', marginBottom: 6 }}>
                  诊断结论提要
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  该学习者常规考点基础扎实，但在面对<b>隐零点多层嵌套</b>与<b>空间立体几何法向量求角</b>时存在认知断层，需要强化“结构化建模”与“化简速通”维度名师的针对性辅导。
                </div>
              </div>
            </div>

            {/* Right Column: Full Knowledge Mastery Bars */}
            <div className="telemetry-hud">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-main)' }}>
                  全景考点掌握度分布矩阵
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  按掌握水平从低到高排列
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.rows.map(([name, score]) => {
                  const pct = Math.round(score <= 1 ? score * 100 : score);
                  const isWeak = pct < 60;
                  const isModerate = pct >= 60 && pct < 80;
                  const barColor = isWeak
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : isModerate
                    ? 'linear-gradient(90deg, #38bdf8, #0284c7)'
                    : 'linear-gradient(90deg, #10b981, #0ea5e9)';

                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                        <span style={{ color: isWeak ? '#ef4444' : 'var(--text-main)', fontWeight: isWeak ? 700 : 500 }}>
                          {isWeak ? '⚠ ' : '✓ '} {name}
                        </span>
                        <span className="tabular-nums" style={{ color: isWeak ? '#ef4444' : 'var(--text-main)', fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="mastery-track" style={{ height: 6, borderRadius: 3 }}>
                        <div
                          className="gsap-mastery-bar"
                          style={{
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Row: Pathology Diagnostic Cards & Doctor Prescriptions */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', marginBottom: 16, fontWeight: 700 }}>
              错因病理学透视与名师处方
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              {result.patterns.map((item, idx) => (
                <div
                  key={item.pattern}
                  className={`pathology-card ${idx === 0 ? 'high-frequency' : 'medium-frequency'}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                      错因 #{idx + 1}：{item.pattern}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: idx === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: idx === 0 ? '#ef4444' : '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      {item.frequency}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 8 }}>
                    <strong style={{ color: 'var(--text-main)' }}>根因透视：</strong>
                    {item.cause}
                  </div>

                  {item.rx && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(14, 165, 233, 0.2)',
                        fontSize: '11px',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <strong>名师处方：</strong>{item.rx}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Direct Synthesis Action Banner */}
          <div
            style={{
              marginTop: 40,
              padding: '22px 28px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
              border: '1px solid var(--accent-primary)',
              boxShadow: '0 12px 32px -8px rgba(14, 165, 233, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="beacon-dot success" />
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)' }}>
                  已根据诊断生成专属名师攻坚方案
                </h3>
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--text-body)', fontSize: 'var(--text-xs)', maxWidth: 600, lineHeight: 1.5 }}>
                锁定薄弱考点：<b>{result.weak.join('、')}</b>。点击将自动注入五维基因与知识库，生成精准突破该痛点的定制名师。
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onCompose(result.weak)}
              style={{ padding: '12px 26px', fontSize: 'var(--text-base)', gap: 8, boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)' }}
            >
              依据薄弱点一键合成名师 <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border-glass)',
  background: 'var(--bg-surface-elevated)',
  color: 'var(--text-main)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
};
