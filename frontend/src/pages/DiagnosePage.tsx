import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RefreshCw, Zap, Check, Lightbulb, ArrowRight, AlertTriangle, CheckCircle2, ChevronRight, Activity, Compass, Brain } from 'lucide-react';
import { useCountUp } from '../lib/gsap';
import { cognitiveApi } from '../services/eduApi';
import { getLearnerId, getLearnerName, writeDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

const SUBJECTS = ['数学', '物理', '化学', '语文', '英语'];
const GRADES = ['全学段通用', '高中 (9-12年级)', '初中 (6-8年级)', '小学高段 (4-5年级)'];

interface HeatmapTopic {
  name: string;
  mastery: number; // 0 to 1
  irtB: number; // Difficulty parameter b
  irtA: number; // Discrimination parameter a
  errorReason: string;
}

interface DomainGroup {
  domain: string;
  topics: HeatmapTopic[];
}

const HEATMAP_DOMAINS: DomainGroup[] = [
  {
    domain: '代数与函数',
    topics: [
      { name: '集合与逻辑命题', mastery: 0.92, irtB: 0.2, irtA: 1.1, errorReason: '基础扎实，极少出现失误' },
      { name: '二次函数对称轴与单峰', mastery: 0.88, irtB: 0.5, irtA: 1.2, errorReason: '区间动轴讨论偶有粗心' },
      { name: '复合函数单调性', mastery: 0.76, irtB: 0.9, irtA: 1.4, errorReason: '内外层符号同增异减判定正确' },
      { name: '抽象函数对称与周期', mastery: 0.62, irtB: 1.3, irtA: 1.6, errorReason: '赋值法未充分讨论自变量奇偶' },
      { name: '隐零点代换与范围', mastery: 0.38, irtB: 2.1, irtA: 1.9, errorReason: '缺乏构造超越方程隐零点的直觉' },
    ],
  },
  {
    domain: '解析几何',
    topics: [
      { name: '直线与圆相交切线', mastery: 0.85, irtB: 0.6, irtA: 1.2, errorReason: '弦心距公式掌握良好' },
      { name: '椭圆方程与离心率', mastery: 0.45, irtB: 1.7, irtA: 1.8, errorReason: '焦点三角形几何关系推导断层' },
      { name: '双曲线渐近线性质', mastery: 0.72, irtB: 1.1, irtA: 1.4, errorReason: '共渐近线方程系代换熟练' },
      { name: '抛物线焦点弦与准线', mastery: 0.81, irtB: 0.8, irtA: 1.3, errorReason: '焦半径定义运用准确' },
      { name: '联立韦达定理弦长', mastery: 0.49, irtB: 1.8, irtA: 1.9, errorReason: '非对称式展开时运算超载' },
    ],
  },
  {
    domain: '立体几何',
    topics: [
      { name: '空间向量建系基底', mastery: 0.85, irtB: 0.7, irtA: 1.3, errorReason: '空间坐标系建立逻辑严密' },
      { name: '线面垂直平行判定', mastery: 0.90, irtB: 0.4, irtA: 1.2, errorReason: '公理定理证明书写规范' },
      { name: '二面角法向量余弦', mastery: 0.78, irtB: 1.0, irtA: 1.5, errorReason: '锐钝角根据直观几何判断偶有偏差' },
      { name: '锥柱外接球内切球', mastery: 0.54, irtB: 1.6, irtA: 1.7, errorReason: '补形法与球心截面圆半径转化受阻' },
    ],
  },
  {
    domain: '概率与统计',
    topics: [
      { name: '条件概率全概率公式', mastery: 0.82, irtB: 0.8, irtA: 1.3, errorReason: '贝叶斯事件逆向推导正确' },
      { name: '超几何分布与二项分布', mastery: 0.79, irtB: 0.9, irtA: 1.4, errorReason: '放回与不放回模型区分明确' },
      { name: '正态分布三西格玛原则', mastery: 0.86, irtB: 0.5, irtA: 1.2, errorReason: '区间积分对称变换掌握到位' },
      { name: '线性回归与相关系数', mastery: 0.91, irtB: 0.3, irtA: 1.1, errorReason: '计算公式运用熟练' },
    ],
  },
  {
    domain: '导数与不等式',
    topics: [
      { name: '导数几何意义与切线', mastery: 0.88, irtB: 0.6, irtA: 1.3, errorReason: '切点切线方程计算准确' },
      { name: '导数单调性与极值', mastery: 0.76, irtB: 0.9, irtA: 1.4, errorReason: '分类讨论零点大小偶有遗漏' },
      { name: '极值点偏移差函数', mastery: 0.38, irtB: 2.2, irtA: 2.1, errorReason: '对称差函数 F(x)=f(x)-f(2x₀-x) 构造困难' },
      { name: '函数零点存在切线放缩', mastery: 0.42, irtB: 2.0, irtA: 2.0, errorReason: '指数 e^x≥x+1 切线放缩临界未讨论' },
      { name: '参数分离与恒成立', mastery: 0.44, irtB: 1.9, irtA: 1.8, errorReason: '自变量取值范围分离时分母正负混淆' },
    ],
  },
];

/* 5大知识域能力雷达图组件 */
const DomainRadarChart: React.FC<{ domains: DomainGroup[] }> = ({ domains }) => {
  const size = 260;
  const center = size / 2;
  const radius = 80;
  const count = domains.length;

  const data = useMemo(() => {
    return domains.map((d) => {
      const avg = d.topics.reduce((acc, t) => acc + t.mastery, 0) / d.topics.length;
      return { domain: d.domain, avg: Math.round(avg * 100) };
    });
  }, [domains]);

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { x, y };
  };

  const levels = [0.33, 0.66, 1.0];
  const gridPolygons = levels.map((lvl) => {
    return data.map((_, i) => {
      const { x, y } = getCoordinates(lvl, i);
      return `${x},${y}`;
    }).join(' ');
  });

  const polygonPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(Math.min(1.0, Math.max(0.2, d.avg / 100)), i);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="domainRadarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0071e3" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* 同心多边形背景网格 */}
        {gridPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill={idx === levels.length - 1 ? 'rgba(0, 113, 227, 0.02)' : 'none'}
            stroke="var(--border-glass)"
            strokeWidth="1"
            strokeDasharray={idx < 2 ? '2 2' : 'none'}
          />
        ))}

        {/* 轴线与文字 */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(1.0, i);
          const labelCoord = getCoordinates(1.22, i);
          return (
            <g key={d.domain}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="var(--border-glass)" strokeWidth="1" />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight="700"
                fill={d.avg < 60 ? 'var(--accent-primary)' : 'var(--text-muted)'}
              >
                {d.domain}
              </text>
              <text
                x={labelCoord.x}
                y={labelCoord.y + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="800"
                fontFamily="monospace"
                fill={d.avg < 60 ? 'var(--accent-primary)' : 'var(--text-main)'}
              >
                {d.avg}%
              </text>
            </g>
          );
        })}

        {/* 雷达多边形填充 */}
        <polygon
          points={polygonPoints}
          fill="url(#domainRadarGrad)"
          stroke="var(--accent-primary)"
          strokeWidth="2"
        />

        {/* 顶点发光圆圈 */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.avg / 100, i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="var(--bg-surface)"
              stroke="var(--accent-primary)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};


interface Props {
  onCompose: (weakKnowledge: string[]) => void;
}

export const DiagnosePage: React.FC<Props> = ({ onCompose }) => {
  const [subject, setSubject] = useState('数学');
  const [grade, setGrade] = useState('全学段通用');
  const [busy, setBusy] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HeatmapTopic | null>(HEATMAP_DOMAINS[4].topics[2]); // Default to 极值点偏移
  const [abilityLevel, setAbilityLevel] = useState('Level A+ (高阶思维层)');
  const [theta, setTheta] = useState(1.42);
  const [confidence, setConfidence] = useState(0.94);

  const learnerId = getLearnerId();
  const learnerName = getLearnerName();
  const thetaShown = useCountUp(Math.round(theta * 100), 0.8, true);
  const confShown = useCountUp(Math.round(confidence * 100), 0.8, true);

  const runDiagnosis = async () => {
    setBusy(true);
    try {
      const res = await cognitiveApi.fullDiagnosis(learnerId, subject, grade);
      if (res && res.ability) {
        setAbilityLevel(res.ability.level || 'Level A+ (高阶思维层)');
        setTheta(res.ability.theta || 1.42);
        setConfidence(res.ability.confidence || 0.94);
      }
    } finally {
      setBusy(false);
    }
  };

  const getMasteryTierClass = (score: number) => {
    if (score < 0.5) return 'heatmap-cell--critical';
    if (score < 0.65) return 'heatmap-cell--warning';
    if (score < 0.8) return 'heatmap-cell--good';
    return 'heatmap-cell--mastered';
  };

  const getTierLabel = (score: number) => {
    if (score < 0.5) return '严重薄弱';
    if (score < 0.65) return '易错巩固';
    if (score < 0.8) return '基础扎实';
    return '透彻精通';
  };

  // Collect weak topics from heatmap
  const allWeakTopics = HEATMAP_DOMAINS.flatMap((d) => d.topics.filter((t) => t.mastery < 0.6)).map((t) => t.name);

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 80px' }}>
      <div className="app-container">
        
        {/* =================================================================
            1. HEADER: MASSIVE APPLE TYPOGRAPHY & IDENTITY BADGE (强化主标题)
            ================================================================= */}
        <header style={{ marginBottom: 32, textAlign: 'left' }}>
          <div className="apple-pro-eyebrow" style={{ marginBottom: 12 }}>
            <span className="apple-status-dot apple-status-dot--primary" />
            <span>IRT COGNITIVE ARCHITECTURE · 认知穿透中枢 · {learnerName}</span>
          </div>

          <h1 className="apple-monumental-headline" style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.2rem)', textAlign: 'left', margin: '8px 0 12px', textWrap: 'balance' }}>
            全域知识网络与认知掌握度热力矩阵
          </h1>

          <p className="apple-pro-subtitle" style={{ textAlign: 'left', maxWidth: '44em', margin: 0, textWrap: 'balance' }}>
            摒弃单薄的线性列表。矩阵色阶精准映射 5 大知识域掌握深度，通过 IRT 潜能曲线穿透隐性认知断层，直击高频失分命门。
          </p>
        </header>

        {/* =================================================================
            2. TOP CONTROLS & DUAL-PANEL DASHBOARD (指标看板与知识域能力雷达)
            ================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28, alignItems: 'stretch' }}>
          {/* 左侧：3项 IRT 关键度量 + 宏观能力评定 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div className="apple-activity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px 20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>IRT 能力层级</div>
                <div className="apple-keynote-stat-val" style={{ fontSize: '1.75rem', margin: '4px 0', color: 'var(--accent-primary)' }}>{abilityLevel}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>位列全省理科前 3.5% 认知区段</div>
              </div>

              <div className="apple-activity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px 20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>潜能值 (θ Theta)</div>
                <div className="apple-keynote-stat-val" style={{ fontSize: '1.75rem', margin: '4px 0' }}>
                  +{(thetaShown / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>高难度压轴题具备穿透力</div>
              </div>

              <div className="apple-activity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px 20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>推断置信度</div>
                <div className="apple-keynote-stat-val" style={{ fontSize: '1.75rem', margin: '4px 0' }}>{confShown}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>基于 142 组多模态题项采样</div>
              </div>
            </div>

            {/* 宏观认知健康度综述卡 */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 113, 227, 0.1)', border: '1px solid rgba(0, 113, 227, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <Brain size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-main)' }}>
                    全域知识掌握度：71.3% (良好进阶)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    代数与概统相对均衡，主要认知断层集中于【导数极值构造】与【解析几何非对称展开】
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-blue" style={{ fontSize: '11px', padding: '3px 10px' }}>{allWeakTopics.length} 处攻坚突破口</span>
              </div>
            </div>
          </div>

          {/* 右侧：5大知识域能力雷达星盘 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 750, color: 'var(--text-main)' }}>
                <Compass size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>5 大知识域能力拓扑星盘</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>全域实时掌握度映射</span>
            </div>
            <DomainRadarChart domains={HEATMAP_DOMAINS} />
          </div>
        </div>

        {/* Toolbar Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 9999,
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 650,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 9999,
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 650,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>

            <button
              type="button"
              className="apple-btn-pill-primary"
              disabled={busy}
              onClick={runDiagnosis}
              style={{ height: 38, padding: '0 20px', fontSize: '13px' }}
            >
              <RefreshCw size={13} className={busy ? 'spin' : ''} />
              <span>{busy ? '正在计算 IRT 矩阵...' : '重新评估掌握度'}</span>
            </button>
          </div>

          {/* Apple Monochromatic Color Legend */}
          <div style={{ display: 'flex', gap: 18, fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
              <span>核心攻坚卡点 (&lt;60%)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-muted)', border: '1px solid var(--border-glass)' }} />
              <span>常规稳固考点 (≥60%)</span>
            </span>
          </div>
        </div>

        {/* =================================================================
            3. KNOWLEDGE MASTERY HEATMAP GRID (知识掌握度热力图矩阵)
            ================================================================= */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: '28px 30px', marginBottom: 32, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ marginBottom: 20 }}>
            <strong style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 700 }}>
              学科核心知识掌握矩阵 · 单击单元格下钻 IRT 深度诊断
            </strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {HEATMAP_DOMAINS.map((group) => (
              <div key={group.domain} className="heatmap-domain-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-muted)' }}>{group.domain}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {group.topics.map((t) => {
                    const isSelected = selectedTopic?.name === t.name;
                    const isWeak = t.mastery < 0.6;
                    const pct = Math.round(t.mastery * 100);
                    return (
                      <div
                        key={t.name}
                        onClick={() => setSelectedTopic(t)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 16,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-subtle)',
                          border: isSelected 
                            ? '1.5px solid var(--accent-primary)' 
                            : isWeak 
                              ? '1px solid rgba(0, 113, 227, 0.35)' 
                              : '1px solid var(--border-glass)',
                          boxShadow: isSelected ? '0 6px 20px -4px rgba(0, 113, 227, 0.2)' : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 76,
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 650, lineHeight: 1.35, marginBottom: 6, color: 'var(--text-main)' }}>
                          {t.name}
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span className="font-mono-telemetry" style={{ fontWeight: 700, color: isWeak ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                              {pct}%
                            </span>
                            {isWeak && (
                              <span style={{ fontSize: '10px', fontWeight: 650, color: 'var(--accent-primary)', background: 'rgba(0, 113, 227, 0.08)', padding: '2px 7px', borderRadius: 9999 }}>
                                攻坚卡点
                              </span>
                            )}
                          </div>
                          {/* 微型能量槽 */}
                          <div style={{ height: 3.5, borderRadius: 9999, background: 'var(--border-glass)', marginTop: 6, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                borderRadius: 9999,
                                background: isWeak ? 'linear-gradient(90deg, #ef4444, #0071e3)' : 'linear-gradient(90deg, #38bdf8, #10b981)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================
            4. CELL DRILLDOWN INSPECTOR CARD (Apple Pro 下钻透析面板)
            ================================================================= */}
        {selectedTopic && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glass)',
              borderRadius: 24,
              padding: '28px 32px',
              boxShadow: '0 8px 30px -4px rgba(0, 113, 227, 0.12)',
              marginBottom: 36,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--accent-primary)', fontSize: '11px', padding: '3px 10px', borderRadius: 9999, fontWeight: 650, display: 'inline-block', marginBottom: 6 }}>
                  考点下钻透析
                </span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '4px 0 0', fontWeight: 800 }}>
                  {selectedTopic.name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>当前掌握度</div>
                <div className="apple-keynote-stat-val" style={{ fontSize: '2.4rem', color: selectedTopic.mastery < 0.6 ? 'var(--accent-primary)' : 'var(--text-main)', margin: 0 }}>
                  {Math.round(selectedTopic.mastery * 100)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, background: 'var(--bg-surface-elevated)', padding: '18px 22px', borderRadius: 16, border: '1px solid var(--border-glass)', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>题项难度系数 (IRT b)</div>
                <div style={{ fontSize: '18px', fontWeight: 750, color: 'var(--text-main)', fontFamily: 'monospace', margin: '4px 0 2px' }}>b = {selectedTopic.irtB}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>核心进阶高阶考点</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>区分度指数 (IRT a)</div>
                <div style={{ fontSize: '18px', fontWeight: 750, color: 'var(--text-main)', fontFamily: 'monospace', margin: '4px 0 2px' }}>a = {selectedTopic.irtA}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>极高分水岭鉴别力</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>攻坚推荐方式</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: 4 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={14} />
                    <span>特级名师定制攻坚</span>
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>建议苏格拉底递进启发</div>
              </div>
            </div>

            {/* 三段认知阻滞断层图解树 (Cognitive Blocker Tree) */}
            <div className="blocker-tree-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 750 }}>
                    三段认知阻滞断层图解 · 错因直观定位
                  </strong>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  多模态答题推导链精准锚定
                </span>
              </div>

              <div className="blocker-tree-flow">
                {/* 阶段 1 */}
                <div className="blocker-tree-node blocker-tree-node--passed">
                  <div className="blocker-node-header">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>阶段 01 · 审题感知</span>
                    <div className="blocker-node-icon"><CheckCircle2 size={16} /></div>
                  </div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>考点与已知条件读取</strong>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    锁定未知量与边界限制，审题耗时正常，初步定位考点无偏差。
                  </p>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#10b981' }}>✓ 审题通过 (92%)</span>
                </div>

                {/* 连线 1 */}
                <div className="blocker-tree-arrow">
                  <ChevronRight size={20} />
                </div>

                {/* 阶段 2 */}
                <div className={`blocker-tree-node ${selectedTopic.mastery < 0.6 ? 'blocker-tree-node--blocked' : 'blocker-tree-node--passed'}`}>
                  <div className="blocker-node-header">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: selectedTopic.mastery < 0.6 ? '#ef4444' : 'var(--text-muted)' }}>
                      阶段 02 · 核心建模
                    </span>
                    <div className="blocker-node-icon">
                      {selectedTopic.mastery < 0.6 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                  </div>
                  <strong style={{ fontSize: '13px', color: selectedTopic.mastery < 0.6 ? '#ef4444' : 'var(--text-main)' }}>
                    {selectedTopic.mastery < 0.6 ? '⚠ 关键转化受阻 (认知断裂点)' : '辅助线与模型映射构建'}
                  </strong>
                  <p style={{ fontSize: '11.5px', color: selectedTopic.mastery < 0.6 ? 'var(--text-main)' : 'var(--text-muted)', margin: 0, lineHeight: 1.4, fontWeight: selectedTopic.mastery < 0.6 ? 600 : 400 }}>
                    {selectedTopic.errorReason}
                  </p>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: selectedTopic.mastery < 0.6 ? '#ef4444' : '#10b981' }}>
                    {selectedTopic.mastery < 0.6 ? `✕ 掌握度仅 ${Math.round(selectedTopic.mastery * 100)}% · 关键卡点` : '✓ 转化顺畅 (85%)'}
                  </span>
                </div>

                {/* 连线 2 */}
                <div className="blocker-tree-arrow">
                  <ChevronRight size={20} />
                </div>

                {/* 阶段 3 */}
                <div className={`blocker-tree-node ${selectedTopic.mastery < 0.6 ? 'blocker-tree-node--pending' : 'blocker-tree-node--passed'}`}>
                  <div className="blocker-node-header">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>阶段 03 · 运算迁移</span>
                    <div className="blocker-node-icon">
                      {selectedTopic.mastery < 0.6 ? <Activity size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                  </div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                    {selectedTopic.mastery < 0.6 ? '未能触达求解闭环' : '严密推演与变式迁移'}
                  </strong>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {selectedTopic.mastery < 0.6 ? '由于第2步发生认知断裂，强行看答案会导致伪学会，需名师搭桥。' : '推导计算精准，能自如迁移到变式压轴题。'}
                  </p>
                  <span style={{ fontSize: '10.5px', fontWeight: 650, color: selectedTopic.mastery < 0.6 ? 'var(--text-muted)' : '#10b981' }}>
                    {selectedTopic.mastery < 0.6 ? '— 待突破后激活' : '✓ 达成举一反三'}
                  </span>
                </div>
              </div>

              {/* 特级名师启发式搭桥支架图解 */}
              <div className="scaffold-bridge-card">
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0, 113, 227, 0.12)', border: '1px solid rgba(0, 113, 227, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                  <Zap size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 750 }}>
                      特级名师循智搭桥破障方案
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--accent-primary)', background: 'rgba(0, 113, 227, 0.1)', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                      苏格拉底递进反问
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>
                    针对该考点的典型错因，系统将调用特级名师通过<strong>“分步反问启发 + 数形转化辅助支架”</strong>，引导学生亲手推导出关键中间量，跨越思维阻滞，建立持久神经回路。
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 22 }}>
              <button
                type="button"
                className="apple-btn-pill-primary"
                onClick={() => onCompose([selectedTopic.name])}
                style={{ height: 42, padding: '0 24px', fontSize: '13px' }}
              >
                <span>针对【{selectedTopic.name}】合成名师微课</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="apple-btn-link"
                onClick={() => setSelectedTopic(null)}
                style={{ fontSize: '13px', padding: '0 12px' }}
              >
                <span>收起详情</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            5. BOTTOM GLOBAL ACTION BAR (Apple 悬浮微晶直达底栏)
            ================================================================= */}
        <div
          style={{
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
            <strong style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 700 }}>
              热力矩阵已锁定 {allWeakTopics.length} 处攻坚突破口
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              包括：{allWeakTopics.slice(0, 3).join('、')} 等关键阻滞考点。
            </p>
          </div>
          <button
            type="button"
            className="apple-btn-pill-primary"
            style={{ height: 42, padding: '0 28px', fontSize: '14px' }}
            onClick={() => onCompose(allWeakTopics)}
          >
            <span>按全套薄弱点定向合成名师</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
};
