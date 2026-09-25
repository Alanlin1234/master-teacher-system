import React, { useRef, useState } from 'react';
import { useCountUp, useMasteryReveal } from '../lib/gsap';
import { cognitiveApi } from '../services/eduApi';
import { getLearnerId, writeDiagnosis } from '../services/learnerStore';
import { LearnerBind } from '../components/LearnerBind';

const SUBJECTS = ['数学', '语文', '英语', '物理', '化学'];
const GRADES = ['高一', '高二', '高三', '初三', '初二'];

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
    level: string;
    theta: number;
    confidence: number;
    rows: Array<[string, number]>;
    patterns: Array<{ pattern: string; frequency: string; cause: string }>;
    recommendations: Array<{ content: string }>;
    weak: string[];
  } | null>(null);

  useMasteryReveal(panelRef, result ? result.rows.map((row) => row[0]).join('|') : 'empty');
  const thetaShown = useCountUp(Math.round((result?.theta || 0) * 100), 1.1, !!result);
  const confShown = useCountUp(Math.round((result?.confidence || 0) * 100), 1.1, !!result);

  const run = async () => {
    const userId = getLearnerId();
    if (!userId) {
      setError('先绑定学习者。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await cognitiveApi.fullDiagnosis(userId, subject, grade);
      const rows = Object.entries(res.knowledge_mastery || {}).sort((a, b) => a[1] - b[1]);
      const weak = res.weak_knowledge || [];
      setResult({
        level: res.ability?.level || '—',
        theta: res.ability?.theta || 0,
        confidence: res.ability?.confidence || 0,
        rows,
        patterns: res.error_patterns || [],
        recommendations: res.recommendations || [],
        weak,
      });
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
      setError('诊断没有完成。请确认 8000 后端可用，且该学习者已有学习记录。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '36px 0 72px' }}>
      <div className="app-container">
        <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--accent-primary)', fontWeight: 700 }}>诊断</p>
        <h1 style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', marginTop: 8 }}>认知诊断</h1>
        <LearnerBind onBound={() => setBoundTick((n) => n + 1)} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '22px 0 28px', flexWrap: 'wrap' }}>
          <select aria-label="学科" value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
            {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="年级" value={grade} onChange={(e) => setGrade(e.target.value)} style={selectStyle}>
            {GRADES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={run}>
            {busy ? '诊断中' : '开始诊断'}
          </button>
          {busy && <span className="status-beacon" style={{ background: 'var(--accent-primary)' }} />}
          <span style={{ display: 'none' }}>{boundTick}</span>
        </div>
        {error && <p style={{ color: 'var(--text-body)' }}>{error}</p>}
        {result && (
          <div ref={panelRef}>
            <div className="diag-split">
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>能力水平</div>
                <div className="stat-figure">{result.level}</div>
                <div style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>theta</div>
                <div className="stat-figure tabular-nums">{(thetaShown / 100).toFixed(2)}</div>
                <div style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>置信度</div>
                <div className="stat-figure tabular-nums">{confShown}%</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.rows.map(([name, score]) => {
                  const pct = Math.round(score <= 1 ? score * 100 : score);
                  const weak = pct < 60;
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: weak ? '#d97706' : 'var(--text-main)' }}>{name}</span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="mastery-track">
                        <div className="gsap-mastery-bar" style={{ width: `${pct}%`, background: weak ? '#d97706' : '#059669' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="diag-split" style={{ marginTop: 36 }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)' }}>错因</h2>
                {result.patterns.length === 0 && <p style={{ color: 'var(--text-muted)' }}>—</p>}
                {result.patterns.map((item) => (
                  <p key={item.pattern} style={{ color: 'var(--text-body)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{item.pattern}</strong>
                    {item.frequency ? ` · ${item.frequency}` : ''}
                    <br />{item.cause}
                  </p>
                ))}
              </div>
              <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: 28 }}>
                <h2 style={{ fontSize: 'var(--text-lg)' }}>建议</h2>
                {result.recommendations.map((item) => (
                  <p key={item.content} style={{ color: 'var(--text-body)' }}>{item.content}</p>
                ))}
              </div>
            </div>
            <div className="next-bar">
              <button type="button" className="btn btn-primary" onClick={() => onCompose(result.weak)}>
                按这些薄弱点合成名师
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  height: 40,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border-glass)',
  background: 'var(--bg-surface)',
  color: 'var(--text-main)',
};
