import React, { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../lib/gsap';
import { cognitiveApi } from '../services/eduApi';
import { getLearnerId, getLearnerName, writeDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

const SUBJECTS = ['数学', '物理', '化学', '语文', '英语'];
const GRADES = ['高三', '高二', '高一', '初三', '初二'];

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

interface Props {
  onCompose: (weakKnowledge: string[]) => void;
}

export const DiagnosePage: React.FC<Props> = ({ onCompose }) => {
  const [subject, setSubject] = useState('数学');
  const [grade, setGrade] = useState('高三');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="badge badge-amber" style={{ fontSize: '13px', padding: '4px 14px' }}>
              IRT 认知诊断中枢
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              分析对象：<strong style={{ color: 'var(--text-main)' }}>{learnerName}</strong> · 独立学情通道
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.2rem)', fontWeight: 850, letterSpacing: '-0.04em', color: 'var(--text-main)', margin: '8px 0 12px' }}>
            全域知识网络与认知掌握度热力图
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: 'var(--text-body)', maxWidth: '44em', lineHeight: 1.6 }}>
            摒弃单薄的线性列表。矩阵色阶精准映射 5 大知识域掌握深度，通过 IRT 潜能曲线穿透隐性认知断层，直击高频失分命门。
          </p>
        </header>

        {/* =================================================================
            2. TOP CONTROLS & IRT METRICS BAR (指标看板与学科切换)
            ================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4 }}>IRT 综合能力层级</div>
            <div className="stat-figure" style={{ color: 'var(--accent-primary)', fontSize: '1.8rem' }}>{abilityLevel}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: 4 }}>位列全省理科前 3.5% 认知区段</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4 }}>潜在能力值 (θ Theta)</div>
            <div className="stat-figure tabular-nums" style={{ color: 'var(--text-main)', fontSize: '1.8rem' }}>
              +{(thetaShown / 100).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: 4 }}>高难度题项具备极高穿透力</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4 }}>推断置信度 (Confidence)</div>
            <div className="stat-figure tabular-nums" style={{ color: '#10b981', fontSize: '1.8rem' }}>{confShown}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>基于 142 组多模态答题与草稿采样</div>
          </div>
        </div>

        {/* Toolbar Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
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
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={runDiagnosis}
              style={{ height: 40, padding: '0 18px', fontSize: '13px' }}
            >
              {busy ? '正在计算 IRT 矩阵...' : '🔄 重新评估掌握度'}
            </button>
          </div>

          {/* Color Legend */}
          <div style={{ display: 'flex', gap: 14, fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.3)', border: '1px solid #ef4444' }} />
              严重薄弱 (&lt;50%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.3)', border: '1px solid #d97706' }} />
              易错薄弱 (50~65%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.3)', border: '1px solid #10b981' }} />
              良好掌握 (65~80%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(37,99,235,0.3)', border: '1px solid #2563eb' }} />
              透彻掌握 (&gt;80%)
            </span>
          </div>
        </div>

        {/* =================================================================
            3. KNOWLEDGE MASTERY HEATMAP GRID (知识掌握度热力图矩阵)
            ================================================================= */}
        <div className="heatmap-card" style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
              高考数学考点掌握矩阵 (点击任意单元格可下钻查看 IRT 参数与错因)
            </strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {HEATMAP_DOMAINS.map((group) => (
              <div key={group.domain} className="heatmap-domain-row">
                <div className="heatmap-domain-name">{group.domain}</div>
                <div className="heatmap-cell-grid">
                  {group.topics.map((t) => {
                    const isSelected = selectedTopic?.name === t.name;
                    const tierClass = getMasteryTierClass(t.mastery);
                    const pct = Math.round(t.mastery * 100);
                    return (
                      <div
                        key={t.name}
                        className={`heatmap-cell ${tierClass}`}
                        onClick={() => setSelectedTopic(t)}
                        style={{
                          outline: isSelected ? '2px solid var(--accent-primary)' : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 650, lineHeight: 1.3, marginBottom: 6 }}>
                          {t.name}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', opacity: 0.9 }}>
                          <span className="tabular-nums" style={{ fontWeight: 700 }}>{pct}%</span>
                          <span style={{ fontSize: '10px' }}>{getTierLabel(t.mastery)}</span>
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
            4. CELL DRILLDOWN INSPECTOR CARD (单元格深度下钻与错因诊断)
            ================================================================= */}
        {selectedTopic && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--accent-primary-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-lg), 0 0 30px -10px var(--accent-primary-glow)',
              marginBottom: 36,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '11px', marginBottom: 6 }}>
                  考点下钻透析
                </span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '4px 0 0' }}>
                  {selectedTopic.name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>当前掌握度</div>
                <div className="stat-figure tabular-nums" style={{ fontSize: '2rem', color: selectedTopic.mastery < 0.6 ? '#ef4444' : '#10b981' }}>
                  {Math.round(selectedTopic.mastery * 100)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: 'var(--bg-surface-elevated)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-glass)', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>题项难度系数 (IRT b)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>b = {selectedTopic.irtB}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>压轴难度高阶考点</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>区分度指数 (IRT a)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>a = {selectedTopic.irtA}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>极高分水岭鉴别力</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>攻坚推荐方式</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {selectedTopic.mastery < 0.6 ? '🔥 特级名师定制攻坚' : '✅ 正常变式巩固'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>建议苏格拉底递进启发</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                💡 认知阻滞与典型错因剖析：
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.7, background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #d97706' }}>
                {selectedTopic.errorReason}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onCompose([selectedTopic.name])}
                style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 650 }}
              >
                针对【{selectedTopic.name}】一键合成专属名师微课 →
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTopic(null)}
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                收起详情
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            5. BOTTOM GLOBAL ACTION BAR (全域定向合成直通操作栏)
            ================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            padding: '18px 30px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div>
            <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
              热力图已锁定 {allWeakTopics.length} 处攻坚突破口
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              包括：{allWeakTopics.slice(0, 3).join('、')} 等关键阻滞考点。
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: '14px', fontWeight: 650 }}
            onClick={() => onCompose(allWeakTopics)}
          >
            按全套薄弱点一键定向合成特级名师 →
          </button>
        </div>

      </div>
    </div>
  );
};
