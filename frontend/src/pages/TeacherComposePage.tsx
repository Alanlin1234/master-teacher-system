import React, { useState, useEffect } from 'react';
import { composeApi, teachersApi } from '../services/api';
import { ComposeRecipeCard } from '../components/ComposeRecipeCard';
import {
  DnaIcon,
  SparklesIcon,
  BookOpenIcon,
  ChevronRightIcon,
  SlidersIcon,
} from '../components/Icons';

interface Props {
  initialTeacherId?: string;
  onStartChat: (recipe: any) => void;
  onOpenStudio: (recipe: any) => void;
}

export const TeacherComposePage: React.FC<Props> = ({
  initialTeacherId = 't1',
  onStartChat,
  onOpenStudio,
}) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [mode, setMode] = useState<'user' | 'auto' | 'whole'>('user');
  const [synthName, setSynthName] = useState('全能特级智学名师');
  const [selections, setSelections] = useState<Record<string, string>>({
    style: initialTeacherId,
    personality: 't2',
    strengths: initialTeacherId,
    method: 't10',
    communication: 't3',
  });
  const [loading, setLoading] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<any | null>(null);
  const [historySynths, setHistorySynths] = useState<any[]>([]);

  useEffect(() => {
    loadCatalog();
    loadHistory();
  }, []);

  const loadCatalog = async () => {
    try {
      const res = await composeApi.catalog();
      if (res.ok) setCatalog(res.catalog);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await teachersApi.listSynthesized();
      if (res.ok) setHistorySynths(res.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  // 模式切换时自动配置维度
  const handleModeChange = (newMode: 'user' | 'auto' | 'whole') => {
    setMode(newMode);
    if (newMode === 'auto') {
      setSynthName('学情互补·自适应名师');
      setSelections({
        style: 't1',
        personality: 't2',
        strengths: 't4',
        method: 't10',
        communication: 't3'
      });
    } else if (newMode === 'whole') {
      setSynthName('王崇林特级名师·克隆版');
      setSelections({
        style: 't1', personality: 't1', strengths: 't1', method: 't1', communication: 't1'
      });
    }
  };

  // 执行合成
  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const res = await composeApi.synthesize({
        name: synthName,
        mode,
        selections
      });
      if (res.ok) {
        setCurrentRecipe(res.recipe);
        loadHistory();
      }
    } catch (e: any) {
      alert(e.message || '合成失败');
    } finally {
      setLoading(false);
    }
  };

  const dimensionRows = [
    { key: 'style', label: '上课风格', hint: '决定授课的叙事节奏、语言组织与思维基调' },
    { key: 'personality', label: '人格特征', hint: '决定对学生答题卡顿时的耐心、幽默感与共情态度' },
    { key: 'strengths', label: '核心优点', hint: '决定在导数、几何、综合应用题上的解题破局视角' },
    { key: 'method', label: '教学方法', hint: '决定是采用苏格拉底追问、数形结合还是同构变式' },
    { key: 'communication', label: '沟通方式', hint: '决定是温和启发式鼓励，还是严密学术探讨' },
  ];

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 64px', position: 'relative' }}>
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部标题区 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-neon)'
            }}>
              <DnaIcon size={20} />
            </div>
            <h1 style={{ fontSize: '2.1rem', color: '#ffffff', letterSpacing: '-0.035em' }}>
              名师多维教学基因合成工坊
            </h1>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            打破名师个体的物理局限，自由重构上课风格、思维方法与人格特质，经 AI 一致性审查生成专属个人虚拟特级名师
          </p>
        </div>

        {/* 核心双栏配置工坊 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
          {/* 左侧配置矩阵 */}
          <div className="card-impeccable" style={{ padding: '32px' }}>
            {/* 模式选择切换 */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-body)', marginBottom: '10px' }}>
                合成模式选择
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { key: 'user', label: '自由基因拼接', desc: '自主挑选五大维度来源' },
                  { key: 'auto', label: '学情智能匹配', desc: '根据弱项自动互补名师' },
                  { key: 'whole', label: '全量名师克隆', desc: '复制特级教师基线微调' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => handleModeChange(m.key as any)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      border: mode === m.key ? '1px solid var(--cyan-neon)' : '1px solid var(--border-glass)',
                      background: mode === m.key ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: mode === m.key ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all var(--trans-fast)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: mode === m.key ? 'var(--cyan-neon)' : '#ffffff' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 名师命名输入 */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-body)', marginBottom: '8px' }}>
                虚拟名师命名
              </label>
              <input
                type="text"
                value={synthName}
                onChange={e => setSynthName(e.target.value)}
                placeholder="为即将诞生的专属名师命名..."
                className="input-luxury"
              />
            </div>

            {/* 五维度下拉选择矩阵 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-body)' }}>
                <SlidersIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
                <span>五维教学基因拼接矩阵</span>
              </div>

              {dimensionRows.map(row => (
                <div
                  key={row.key}
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {row.hint}
                    </div>
                  </div>

                  {/* 对应名师下拉框 */}
                  <select
                    value={selections[row.key] || 't1'}
                    onChange={e => setSelections({ ...selections, [row.key]: e.target.value })}
                    className="select-luxury"
                    style={{ minWidth: '220px' }}
                  >
                    {catalog.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject} · {t.dimensions?.[row.key]?.value || t.style})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* 提交合成行动按钮 */}
            <button
              onClick={handleSynthesize}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.02rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <SparklesIcon size={18} />
              <span>{loading ? '正在执行基因融合与一致性审查...' : '立即生成专属名师并入库'}</span>
            </button>
          </div>

          {/* 右侧实时配方与已保存历史 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 当前生成的配方展示 */}
            {currentRecipe ? (
              <ComposeRecipeCard
                recipe={currentRecipe}
                onStartChat={() => onStartChat(currentRecipe)}
                onOpenStudio={() => onOpenStudio(currentRecipe)}
              />
            ) : (
              <div className="card-impeccable" style={{ padding: '44px 32px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  color: 'var(--cyan-neon)'
                }}>
                  <DnaIcon size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginTop: '18px', fontWeight: 800 }}>
                  专属基因实验室就绪
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                  在左侧挑选各位特级名师在风格、方法与沟通上的特长，点击下方按钮，即可生成包含五维能力雷达与 AI 审查报告的全新名师！
                </p>
              </div>
            )}

            {/* 历史合成名师库 */}
            {historySynths.length > 0 && (
              <div className="card-impeccable" style={{ padding: '24px' }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenIcon size={16} style={{ color: 'var(--cyan-neon)' }} />
                  <span>我已保存的虚拟名师 ({historySynths.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historySynths.map((h, i) => (
                    <div
                      key={h.id || i}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          创建时间：{h.createdAt || '近期'} · 来源数：{h.sourceTeachers?.length || 2}位名师
                        </div>
                      </div>
                      <button
                        onClick={() => onStartChat(h.recipe || { name: h.name, id: h.id })}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>辅导</span>
                        <ChevronRightIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
