import React, { useEffect, useRef, useState } from 'react';
import { LearnerBind } from '../components/LearnerBind';
import { FocusSparkline } from '../components/FocusSparkline';
import { useCountUp, usePageEnter } from '../lib/gsap';
import { cameraService } from '../services/cameraService';
import { analysisApi, monitorApi, reportsApi } from '../services/eduApi';
import { getLearnerId } from '../services/learnerStore';

type Segment = 'monitor' | 'perception' | 'analysis';
type Period = 'today' | 'week' | 'month';

const STATUS_LABEL: Record<string, string> = {
  focused: '专注',
  distracted: '分心',
  tired: '疲倦',
  absent: '离开',
  idle: '待命',
};

interface Props {
  onDiagnose: () => void;
}

export const CollectPage: React.FC<Props> = ({ onDiagnose }) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [segment, setSegment] = useState<Segment>('monitor');
  const [boundTick, setBoundTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState<number | null>(null);
  const [detail, setDetail] = useState('');
  const [dash, setDash] = useState<{ minutes: number; progress: number; breaks: number } | null>(null);
  const [period, setPeriod] = useState<Period>('week');
  const [perception, setPerception] = useState<{ focus: number | null; accuracy: number | null; behavior: number | null; series: number[] }>({
    focus: null, accuracy: null, behavior: null, series: [],
  });
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<{ summary: string; difficulties: string[]; weak: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  usePageEnter(pageRef, segment);
  const shownScore = useCountUp(score ?? 0, 0.6, score != null);
  const learnerId = getLearnerId();

  useEffect(() => {
    return () => { cameraService.stop(); };
  }, []);

  useEffect(() => {
    if (!learnerId) return;
    monitorApi.getDashboard(learnerId, learnerId).then((res) => {
      const interruptions = res.stats?.interruptions;
      const breaks = interruptions
        ? interruptions.distracted + interruptions.tired + interruptions.absent
        : 0;
      setDash({
        minutes: Math.round((res.stats?.focus_seconds_today || 0) / 60),
        progress: Math.round((res.stats?.goal_progress || 0) * (res.stats?.goal_progress <= 1 ? 100 : 1)),
        breaks,
      });
    }).catch(() => setDash(null));
  }, [learnerId, boundTick, running]);

  useEffect(() => {
    if (segment !== 'perception' || !learnerId) return;
    reportsApi.getPerceptionDashboard(learnerId, period, learnerId).then((result) => {
      const sessions = (result.sessions || {}) as { avg_focus?: number; recent_count?: number };
      const series = Array.isArray(result.attention_series)
        ? (result.attention_series as Array<{ score?: number }>).map((item) => Number(item.score) || 0)
        : [];
      const mastery = result.subject_mastery as Record<string, { mastery_rate?: number }> | undefined;
      const rates = mastery ? Object.values(mastery).map((item) => Number(item.mastery_rate) || 0) : [];
      const accuracy = rates.length ? Math.round(rates.reduce((sum, n) => sum + n, 0) / rates.length) : null;
      setPerception({
        focus: typeof sessions.avg_focus === 'number' ? Math.round(sessions.avg_focus) : null,
        accuracy,
        behavior: typeof sessions.recent_count === 'number' ? sessions.recent_count : null,
        series,
      });
    }).catch(() => {
      setPerception({ focus: null, accuracy: null, behavior: null, series: [] });
      setError('感知数据暂时没有返回。');
    });
  }, [segment, period, learnerId, boundTick]);

  const toggleCamera = async () => {
    if (!learnerId || !videoRef.current) return;
    setError('');
    if (running) {
      cameraService.stop();
      setRunning(false);
      setStatus('idle');
      return;
    }
    try {
      await cameraService.start(videoRef.current);
      setRunning(true);
    } catch {
      setError('无法打开摄像头。请允许浏览器使用相机。');
    }
  };

  useEffect(() => {
    if (!running || !learnerId) return;
    const timer = window.setInterval(async () => {
      const frame = cameraService.captureFrame();
      if (!frame) return;
      try {
        const res = await monitorApi.analyzeFrame(frame, learnerId);
        setStatus(res.status || 'idle');
        setScore(typeof res.score === 'number' ? Math.round(res.score) : null);
        setDetail(res.detail || '');
      } catch {
        setDetail('这一帧分析失败。');
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [running, learnerId]);

  const runAnalysis = async () => {
    if (!learnerId || !content.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await analysisApi.analyze({ learning_content: content.trim(), user_id: learnerId });
      setAnalysis({
        summary: res.summary || '',
        difficulties: res.difficulties || [],
        weak: res.weak_knowledge || [],
      });
    } catch {
      setError('内容分析没有完成。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '36px 0 72px' }}>
      <div className="app-container" ref={pageRef}>
        <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--accent-primary)', fontWeight: 700 }}>采集</p>
        <h1 style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', margin: '8px 0 18px' }}>多模态学情采集</h1>
        <LearnerBind onBound={() => setBoundTick((n) => n + 1)} />
        <div className="segmented" style={{ margin: '22px 0' }} role="tablist">
          {([
            ['monitor', '学习监控'],
            ['perception', '感知数据'],
            ['analysis', '内容分析'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-current={segment === key ? 'page' : undefined} onClick={() => setSegment(key)}>
              {label}
            </button>
          ))}
        </div>

        {!learnerId ? (
          <p style={{ color: 'var(--text-body)' }}>绑定学习者之后才能开摄像头和请求学情。</p>
        ) : (
          <div ref={panelRef} className="work-split">
            {segment === 'monitor' && (
              <>
                <div>
                  <div style={{ position: 'relative' }}>
                    <video ref={videoRef} className="monitor-video" muted playsInline />
                    <div style={{ position: 'absolute', left: 12, top: 12, color: '#f8fafc', fontWeight: 700 }}>
                      {STATUS_LABEL[status] || status}
                      {score != null && <span className="tabular-nums"> · {shownScore}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="button" className="btn btn-primary" onClick={toggleCamera}>{running ? '停止' : '开始'}</button>
                  </div>
                  {detail && <p style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>{detail}</p>}
                </div>
                <div>
                  <Metric label="今日专注分钟" value={dash ? String(dash.minutes) : '—'} />
                  <Metric label="目标进度" value={dash ? `${dash.progress}%` : '—'} />
                  <Metric label="中断次数" value={dash ? String(dash.breaks) : '—'} />
                </div>
              </>
            )}
            {segment === 'perception' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="segmented" style={{ marginBottom: 18 }}>
                  {(['today', 'week', 'month'] as Period[]).map((item) => (
                    <button key={item} type="button" aria-current={period === item ? 'page' : undefined} onClick={() => setPeriod(item)}>
                      {item === 'today' ? '今日' : item === 'week' ? '本周' : '本月'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
                  <Metric label="专注均值" value={perception.focus == null ? '—' : String(perception.focus)} />
                  <Metric label="测验正确率" value={perception.accuracy == null ? '—' : `${perception.accuracy}%`} />
                  <Metric label="行为次数" value={perception.behavior == null ? '—' : String(perception.behavior)} />
                </div>
                <FocusSparkline values={perception.series} />
              </div>
            )}
            {segment === 'analysis' && (
              <>
                <div>
                  <label htmlFor="learning-content" style={{ display: 'block', marginBottom: 8, fontWeight: 650 }}>学习内容</label>
                  <textarea
                    id="learning-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border-glass)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: 14, font: 'inherit' }}
                  />
                  <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} disabled={busy} onClick={runAnalysis}>
                    {busy ? '分析中' : '分析内容'}
                  </button>
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)' }}>摘要</h2>
                  <p style={{ color: 'var(--text-body)' }}>{analysis?.summary || '—'}</p>
                  <h2 style={{ fontSize: 'var(--text-lg)' }}>难点</h2>
                  <ul>{(analysis?.difficulties || []).map((item) => <li key={item}>{item}</li>)}</ul>
                  <h2 style={{ fontSize: 'var(--text-lg)' }}>薄弱知识点</h2>
                  <ul>{(analysis?.weak || []).map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </>
            )}
          </div>
        )}
        {error && <p style={{ color: 'var(--text-body)' }}>{error}</p>}
        <div className="next-bar">
          <button type="button" className="btn btn-primary" onClick={onDiagnose}>去诊断</button>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ marginBottom: 16 }}>
    <div className="stat-figure">{value}</div>
    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{label}</div>
  </div>
);
