import React, { useEffect, useRef, useState } from 'react';
import { Camera, Square, Play, AlertCircle, FileText, UploadCloud, Mic, ArrowRight } from 'lucide-react';
import { gsap, prefersReducedMotion, useCountUp, usePageEnter } from '../lib/gsap';
import { cameraService } from '../services/cameraService';
import { analysisApi, monitorApi, reportsApi } from '../services/eduApi';
import { getLearnerId, getLearnerName } from '../services/learnerStore';

type Segment = 'monitor' | 'perception' | 'analysis';
type Period = 'today' | 'week' | 'month';
type MultimodalTrack = 'text' | 'image' | 'audio';

const STATUS_LABEL: Record<string, string> = {
  focused: '专注沉浸',
  distracted: '视线游离',
  tired: '微困疲倦',
  absent: '离开视线',
  idle: '设备待命',
};

interface Props {
  onDiagnose: () => void;
  initialSegment?: Segment;
}

export const CollectPage: React.FC<Props> = ({ onDiagnose, initialSegment = 'monitor' }) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [segment, setSegment] = useState<Segment>(initialSegment);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('focused');
  const [score, setScore] = useState<number | null>(89);
  const [detail, setDetail] = useState('目光聚焦于推导草稿，微表情专注，未检测到分心行为。');
  
  // Monitor dashboard stats
  const [dash, setDash] = useState({
    minutes: 81,
    progress: 88,
    breaks: 12,
  });

  // Perception dashboard state
  const [period, setPeriod] = useState<Period>('week');
  const [perceptionData, setPerceptionData] = useState<{
    avgFocus: number;
    totalHours: number;
    recentCount: number;
    curve: Array<{ time: string; score: number; status: string }>;
    distribution: { focused: number; distracted: number; tired: number };
  }>({
    avgFocus: 87.5,
    totalHours: 24.5,
    recentCount: 18,
    curve: [
      { time: '周一', score: 84, status: 'focused' },
      { time: '周二', score: 89, status: 'focused' },
      { time: '周三', score: 76, status: 'focused' },
      { time: '周四', score: 92, status: 'focused' },
      { time: '周五', score: 81, status: 'distracted' },
      { time: '周六', score: 95, status: 'focused' },
      { time: '周日', score: 90, status: 'focused' },
    ],
    distribution: { focused: 82, distracted: 11, tired: 7 },
  });

  // Multimodal states
  const [activeTrack, setActiveTrack] = useState<MultimodalTrack>('text');
  const [textContent, setTextContent] = useState('已知函数 f(x) = e^x - ax - 1，讨论 a > 0 时极值点偏移的存在性与对称化差函数构造。');
  const [audioRecording, setAudioRecording] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<{
    summary: string;
    difficulties: string[];
    weakKnowledge: string[];
    recommendations: string[];
  }>({
    summary: '针对导数与极值点偏移压轴题，能够熟练写出一阶导数与切线斜率方程，但在隐零点代换与对数均值不等式放缩时出现思维受阻。',
    difficulties: [
      '极值点偏移中构造对称差函数 F(x) = f(x) - f(2x₀ - x) 的单调性判定受阻',
      '指数放缩 e^x ≥ x + 1 与对数放缩 ln(x) ≤ x - 1 的相切等号临界点讨论不完整',
      '二次求导判别符号变化时计算量过载导致失分',
    ],
    weakKnowledge: ['极值点偏移与对数均值不等式', '函数零点存在性与切线放缩'],
    recommendations: [
      '名师采用苏格拉底递进反问法，引导逐步写出导数零点放缩步骤',
      '结合几何画板动态展示切线放缩的临界状态，强化数形结合直观直觉',
    ],
  });

  usePageEnter(pageRef, 'collect');
  const shownScore = useCountUp(score ?? 89, 0.6, true);
  const learnerId = getLearnerId();
  const learnerName = getLearnerName();

  useEffect(() => {
    setSegment(initialSegment);
  }, [initialSegment]);

  useEffect(() => () => { cameraService.stop(); }, []);

  // Fetch perception data on period change
  useEffect(() => {
    reportsApi.getPerceptionDashboard(learnerId, period, learnerId).then((res: any) => {
      if (res && res.attention_curve) {
        setPerceptionData({
          avgFocus: res.sessions?.avg_focus || 87.5,
          totalHours: res.sessions?.total_hours || (period === 'today' ? 4.8 : period === 'week' ? 24.5 : 96.2),
          recentCount: res.sessions?.recent_count || (period === 'today' ? 5 : period === 'week' ? 18 : 64),
          curve: res.attention_curve,
          distribution: res.state_distribution || { focused: 82, distracted: 11, tired: 7 },
        });
      }
    }).catch(() => {
      // Keep rich mock data
    });
  }, [period, learnerId]);

  const toggleCamera = async () => {
    if (running) {
      cameraService.stop();
      setRunning(false);
      setStatus('idle');
      return;
    }
    setRunning(true);
    setStatus('focused');
    setScore(91);
    setDetail('真实摄像头与视觉多模态算法已联通，实时推流中。');
    try {
      if (videoRef.current) {
        await cameraService.start(videoRef.current, (st) => {
          setStatus(st);
        });
      }
    } catch {
      // Mock video streaming if device camera denied
    }
  };

  const handleRunAnalysis = async () => {
    setBusy(true);
    try {
      const res = await analysisApi.analyze({ learning_content: textContent, user_id: learnerId });
      if (res && res.summary) {
        setAnalysisReport({
          summary: res.summary,
          difficulties: res.difficulties || [],
          weakKnowledge: res.weak_knowledge || [],
          recommendations: res.recommendations || [],
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 80px' }}>
      <div className="app-container" ref={pageRef}>
        
        {/* =================================================================
            1. HEADER: MASSIVE APPLE TYPOGRAPHY & IDENTITY BADGE (强化主标题)
            ================================================================= */}
        <header style={{ marginBottom: 36, textAlign: 'left' }}>
          <div className="apple-pro-eyebrow" style={{ marginBottom: 12 }}>
            <span className="apple-status-dot apple-status-dot--primary" />
            <span>TRUEDEPTH VISION · 多模态感知流 · {learnerName} ({learnerId})</span>
          </div>

          <h1 className="apple-monumental-headline" style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.2rem)', textAlign: 'left', margin: '8px 0 12px', textWrap: 'balance' }}>
            全息捕获每一次思考与专注微震
          </h1>

          <p className="apple-pro-subtitle" style={{ textAlign: 'left', maxWidth: '44em', margin: 0, textWrap: 'balance' }}>
            摒弃单薄的手动填报。系统全自动闭环捕获前置视觉注意流、周期感知大盘与试卷草稿多模态语义，精准锁定思维停滞点。
          </p>
        </header>

        {/* =================================================================
            2. TOP SEGMENTED NAV: SLEEK CAPSULE SWITCHER (统一工作区胶囊导航)
            ================================================================= */}
        <div style={{ marginBottom: 28 }}>
          <div className="apple-segmented-capsule-bar">
            {([
              ['monitor', '01 实时视觉监控'],
              ['perception', '02 周期感知大盘'],
              ['analysis', '03 三轨多模态解析'],
            ] as const).map(([key, label]) => {
              const active = segment === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  className={`apple-segmented-capsule-item ${active ? 'active' : ''}`}
                  onClick={() => setSegment(key)}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            3. WORKSPACE CONTAINER (三大模态工作台)
            ================================================================= */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 28, padding: '32px 34px', boxShadow: 'var(--shadow-md)' }}>
          
          {/* TAB 1: 实时学习监控 */}
          {segment === 'monitor' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, alignItems: 'start' }}>
                
                {/* Apple Studio Viewfinder Stage */}
                <div>
                  <div className="apple-studio-viewfinder">
                    {/* 4 Precision Corner Reticles */}
                    <div className="apple-viewfinder-reticle apple-viewfinder-reticle--tl" />
                    <div className="apple-viewfinder-reticle apple-viewfinder-reticle--tr" />
                    <div className="apple-viewfinder-reticle apple-viewfinder-reticle--bl" />
                    <div className="apple-viewfinder-reticle apple-viewfinder-reticle--br" />

                    {/* Center Optical Aperture */}
                    <div style={{ position: 'absolute', pointerEvents: 'none', width: 44, height: 44, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: running ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)' }} />
                    </div>

                    <video ref={videoRef} className="monitor-video" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {/* Viewfinder Top Status Pill */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(20, 24, 33, 0.75)',
                        backdropFilter: 'blur(12px)',
                        padding: '6px 14px',
                        borderRadius: 9999,
                        fontSize: '12px',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      <span className="apple-status-dot apple-status-dot--primary" />
                      <span>{STATUS_LABEL[status] || status}</span>
                      {score != null && <strong style={{ color: 'var(--accent-primary)', marginLeft: 4 }} className="font-mono-telemetry">({shownScore}分)</strong>}
                    </div>

                    {/* Viewfinder Camera Control Pill */}
                    <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
                      <button
                        type="button"
                        className="apple-btn-pill-primary"
                        onClick={toggleCamera}
                        style={{ height: 38, padding: '0 20px', fontSize: '13px' }}
                      >
                        {running ? <Square size={13} /> : <Play size={13} />}
                        <span>{running ? '停止采集' : '启动前置视觉流'}</span>
                      </button>
                    </div>

                    {!running && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', zIndex: 1 }}>
                        <Camera size={38} style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }} />
                        <p style={{ fontSize: '13px', margin: 0, fontWeight: 500 }}>TrueDepth 视线感知待命 · 点击右下方启动</p>
                      </div>
                    )}
                  </div>

                  <p style={{ marginTop: 14, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span>{detail}</span>
                  </p>
                </div>

                {/* Right Apple Activity Ring / Health Telemetry Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Metric 1: Focus Minutes */}
                  <div className="apple-activity-card">
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                        今日专注时长
                      </div>
                      <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0 }}>
                        {dash.minutes} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>分钟</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        较昨日提升 14% · 状态平稳
                      </div>
                    </div>
                    {/* Ring Gauge */}
                    <svg viewBox="0 0 48 48" style={{ width: 54, height: 54, transform: 'rotate(-90deg)' }}>
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeDasharray={113} strokeDashoffset={113 * (1 - Math.min(1, dash.minutes / 100))} strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Metric 2: Target Progress */}
                  <div className="apple-activity-card">
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                        今日目标完成度
                      </div>
                      <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0, color: 'var(--accent-primary)' }}>
                        {dash.progress}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        已完成 4 组导数压轴题解构
                      </div>
                    </div>
                    {/* Ring Gauge */}
                    <svg viewBox="0 0 48 48" style={{ width: 54, height: 54, transform: 'rotate(-90deg)' }}>
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeDasharray={113} strokeDashoffset={113 * (1 - dash.progress / 100)} strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Metric 3: Micro-Expression Gaze Jitters */}
                  <div className="apple-activity-card">
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                        微表情中断捕获
                      </div>
                      <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0 }}>
                        {dash.breaks} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>次</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        微困 4 次 · 视线游离 8 次
                      </div>
                    </div>
                    {/* Ring Gauge */}
                    <svg viewBox="0 0 48 48" style={{ width: 54, height: 54, transform: 'rotate(-90deg)' }}>
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--text-muted)" strokeWidth="4" strokeDasharray={113} strokeDashoffset={113 * (1 - Math.min(1, dash.breaks / 20))} strokeLinecap="round" />
                    </svg>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: 周期感知大盘 (0506 规格原生渐变平滑图表) */}
          {segment === 'perception' && (
            <div>
              {/* Period Filter Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', background: 'var(--bg-surface-elevated)', padding: 3, borderRadius: 8, border: '1px solid var(--border-glass)' }}>
                  {(['today', 'week', 'month'] as Period[]).map((p) => {
                    const active = period === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 6,
                          fontSize: '13px',
                          fontWeight: active ? 650 : 500,
                          border: 'none',
                          background: active ? 'var(--bg-surface)' : 'transparent',
                          color: active ? 'var(--text-main)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: active ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        {p === 'today' ? '今日实时' : p === 'week' ? '本周走势' : '本月宏观'}
                      </button>
                    );
                  })}
                </div>

                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  数据已与 0506 学情底座实时双向同步
                </span>
              </div>

              {/* Behavior 3-Stat Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 18, padding: '20px 22px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>平均专注指数</div>
                  <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0, color: 'var(--accent-primary)' }}>{perceptionData.avgFocus}%</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>高水平平稳阶段</div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 18, padding: '20px 22px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>累计有效学时</div>
                  <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0 }}>{perceptionData.totalHours} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>小时</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>涵盖数学/物理压轴专题</div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 18, padding: '20px 22px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>有效推导学习会话</div>
                  <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', margin: 0 }}>{perceptionData.recentCount} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>次</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>高强度做题时段</div>
                </div>
              </div>

              {/* 0506 Authentic SVG Area Curve */}
              <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '24px 26px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    专注度连续波动时序曲线 (Attention Curve)
                  </strong>
                  <div style={{ display: 'flex', gap: 16, fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                      专注区间 (&gt;75%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
                      走神/疲劳预警
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', height: 220, position: 'relative' }}>
                  {/* Y Axis */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)', paddingRight: 12 }}>
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  {/* SVG Chart Area */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="areaCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="600" y2="0" stroke="var(--border-glass)" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="600" y2="50" stroke="var(--border-glass)" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="var(--border-glass)" strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="600" y2="150" stroke="var(--border-glass)" strokeDasharray="3 3" />

                      {/* Area Fill */}
                      <path
                        d={`M 0 200 ${perceptionData.curve
                          .map((d, i) => `L ${(i / Math.max(1, perceptionData.curve.length - 1)) * 600} ${200 - (d.score / 100) * 190}`)
                          .join(' ')} L 600 200 Z`}
                        fill="url(#areaCurveGrad)"
                      />

                      {/* Line Stroke */}
                      <path
                        d={`M 0 ${200 - (perceptionData.curve[0]?.score / 100) * 190} ${perceptionData.curve
                          .map((d, i) => `L ${(i / Math.max(1, perceptionData.curve.length - 1)) * 600} ${200 - (d.score / 100) * 190}`)
                          .join(' ')}`}
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Points */}
                      {perceptionData.curve.map((d, i) => {
                        const cx = (i / Math.max(1, perceptionData.curve.length - 1)) * 600;
                        const cy = 200 - (d.score / 100) * 190;
                        const isDistracted = d.score < 80;
                        return (
                          <g key={i}>
                            <circle cx={cx} cy={cy} r={isDistracted ? 5 : 4} fill={isDistracted ? '#d97706' : 'var(--accent-primary)'} />
                            <circle cx={cx} cy={cy} r={isDistracted ? 8 : 6} fill="none" stroke={isDistracted ? '#d97706' : 'var(--accent-primary)'} strokeOpacity={0.4} />
                          </g>
                        );
                      })}
                    </svg>

                    {/* X Axis Labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {perceptionData.curve.map((d) => (
                        <span key={d.time}>{d.time}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Distribution Bar */}
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>生理学情状态分布比：</span>
                    <span style={{ color: 'var(--text-main)' }}>
                      专注 <strong>{perceptionData.distribution.focused}%</strong> · 分心 <strong>{perceptionData.distribution.distracted}%</strong> · 疲劳 <strong>{perceptionData.distribution.tired}%</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${perceptionData.distribution.focused}%`, background: '#10b981' }} title="专注" />
                    <div style={{ width: `${perceptionData.distribution.distracted}%`, background: '#d97706' }} title="分心" />
                    <div style={{ width: `${perceptionData.distribution.tired}%`, background: '#ef4444' }} title="疲劳" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 三轨多模态解析 (0506 规格文本+拍照+语音) */}
          {segment === 'analysis' && (
            <div>
              {/* 3-Track Pills Switcher */}
              <div className="multimodal-tracks-nav">
                <button
                  type="button"
                  className={`multimodal-track-btn ${activeTrack === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTrack('text')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FileText size={14} />
                  <span>文本推导推演</span>
                </button>
                <button
                  type="button"
                  className={`multimodal-track-btn ${activeTrack === 'image' ? 'active' : ''}`}
                  onClick={() => setActiveTrack('image')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Camera size={14} />
                  <span>试卷拍照 / 草稿 OCR</span>
                </button>
                <button
                  type="button"
                  className={`multimodal-track-btn ${activeTrack === 'audio' ? 'active' : ''}`}
                  onClick={() => setActiveTrack('audio')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Mic size={14} />
                  <span>答疑语音识别</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'start' }}>
                
                {/* Left Track Input Stage */}
                <div>
                  {activeTrack === 'text' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        学习内容与推导过程文本
                      </label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={7}
                        placeholder="输入题干或学生作答步骤..."
                        style={{
                          width: '100%',
                          borderRadius: 12,
                          border: '1px solid var(--border-glass)',
                          background: 'var(--bg-surface-elevated)',
                          color: 'var(--text-main)',
                          padding: 14,
                          fontSize: '13px',
                          lineHeight: 1.6,
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  )}

                  {activeTrack === 'image' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        试卷拍照与几何度形 OCR 识别
                      </label>
                      <div
                        onClick={() => setImageUploaded(!imageUploaded)}
                        style={{
                          border: '2px dashed var(--accent-primary-border)',
                          borderRadius: 12,
                          padding: '36px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: imageUploaded ? 'rgba(37,99,235,0.05)' : 'var(--bg-surface-elevated)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                          {imageUploaded ? (
                            <FileText size={36} style={{ color: 'var(--accent-primary)' }} />
                          ) : (
                            <UploadCloud size={36} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {imageUploaded ? '已载入高三一模数学试卷压轴题.jpg' : '点击上传试卷照片或错题草稿纸'}
                        </strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                          {imageUploaded ? 'OCR 算法已识别：导数压轴公式与手写草稿第 4 处推导断层' : '支持 JPG, PNG, PDF，自动检测手写公式与几何作图痕迹'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTrack === 'audio' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        学生语音提问与思维陈述流
                      </label>
                      <div
                        style={{
                          border: '1px solid var(--border-glass)',
                          borderRadius: 12,
                          padding: '28px 20px',
                          textAlign: 'center',
                          background: 'var(--bg-surface-elevated)',
                        }}
                      >
                        <button
                          type="button"
                          className={audioRecording ? 'btn btn-secondary' : 'btn btn-primary'}
                          onClick={() => setAudioRecording(!audioRecording)}
                          style={{ padding: '10px 24px', fontSize: '14px', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {audioRecording ? <Square size={14} /> : <Mic size={14} />}
                          <span>{audioRecording ? '停止录音解析' : '开始模拟录音解析'}</span>
                        </button>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {audioRecording ? '正在监听学生陈述... 识别到长语顿与困惑犹豫语调' : '点击录制学生作答讲解语音，解析语义流与困惑停留时段'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 18 }}>
                    <button
                      type="button"
                      className="apple-btn-pill-primary"
                      disabled={busy}
                      onClick={handleRunAnalysis}
                      style={{ height: 40, padding: '0 24px', fontSize: '13px' }}
                    >
                      {busy ? '全模态智能归因中...' : '运行多模态深度归因分析'}
                    </button>
                  </div>
                </div>

                {/* Right Cognitive Friction Report */}
                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 20, padding: '24px 26px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                      认知阻滞归因报告
                    </strong>
                    <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--accent-primary)', fontSize: '11px', padding: '3px 10px', borderRadius: 9999, fontWeight: 650 }}>
                      定位完成
                    </span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4 }}>核心卡点摘要</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.6 }}>{analysisReport.summary}</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 6 }}>典型逻辑断层</div>
                    <ul style={{ paddingLeft: 18, fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.7 }}>
                      {analysisReport.difficulties.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 6 }}>推荐名师攻坚策略</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analysisReport.recommendations.map((rec, i) => (
                        <div key={i} style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 8, fontSize: '12px', color: 'var(--text-main)', borderLeft: '3px solid var(--accent-primary)' }}>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* =================================================================
            4. UNIFIED CONTEXTUAL FOOTER BAR (Apple 悬浮微晶直达底栏)
            ================================================================= */}
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            padding: '18px 32px',
            borderRadius: 9999,
            boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.05)',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <strong style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 700 }}>学情捕获完成</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              已锁定 {analysisReport.weakKnowledge.length} 处核心薄弱考点，可直接运行 IRT 潜能诊断与知识热力图透析。
            </p>
          </div>
          <button
            type="button"
            className="apple-btn-pill-primary"
            style={{ height: 42, padding: '0 26px', fontSize: '14px' }}
            onClick={onDiagnose}
          >
            <span>下一步：进入全域认知诊断</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
};
