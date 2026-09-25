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
import { GeneDropdown } from '../components/GeneDropdown';

interface Props {
  initialTeacherId?: string;
  weakKnowledge?: string[];
  onStartChat: (recipe: any) => void;
  onOpenStudio: (recipe: any) => void;
}

export const TeacherComposePage: React.FC<Props> = ({
  initialTeacherId = 't1',
  weakKnowledge = [],
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

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadCatalog();
    loadHistory();
    // 页面加载即刻生成默认配方，确保右侧终端饱满生动
    triggerSynthesize(selections, synthName, mode);
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

  const triggerSynthesize = async (
    targetSelections: Record<string, string>,
    name: string,
    targetMode: 'user' | 'auto' | 'whole'
  ) => {
    try {
      const res = await composeApi.synthesize({
        name,
        mode: targetMode,
        selections: targetSelections
      });
      if (res.ok) {
        setCurrentRecipe(res.recipe);
      }
    } catch (e) {
      console.warn('Live preview synthesize:', e);
    }
  };

  // 模式切换时自动配置维度
  const handleModeChange = (newMode: 'user' | 'auto' | 'whole') => {
    setMode(newMode);
    let nextSelections = { ...selections };
    let nextName = synthName;
    if (newMode === 'auto') {
      nextName = '学情互补·自适应名师';
      nextSelections = {
        style: 't1',
        personality: 't2',
        strengths: 't4',
        method: 't10',
        communication: 't3'
      };
    } else if (newMode === 'whole') {
      nextName = '王崇林特级名师·全息克隆版';
      nextSelections = {
        style: 't1', personality: 't1', strengths: 't1', method: 't1', communication: 't1'
      };
    } else {
      nextName = '多维自由定制名师';
    }
    setSynthName(nextName);
    setSelections(nextSelections);
    triggerSynthesize(nextSelections, nextName, newMode);
  };

  const handleSelectionChange = (key: string, teacherId: string) => {
    const nextSelections = { ...selections, [key]: teacherId };
    setSelections(nextSelections);
    triggerSynthesize(nextSelections, synthName, mode);
  };

  // 执行最终保存入库
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
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e: any) {
      alert(e.message || '合成失败');
    } finally {
      setLoading(false);
    }
  };

  const dimensionRows = [
    { key: 'style', label: '上课风格', trait: '教学叙事基调', hint: '决定授课节奏、思维脉络与语言基调' },
    { key: 'personality', label: '人格特征', trait: '情绪与共情力', hint: '决定答题卡顿时的耐心、幽默与共情态度' },
    { key: 'strengths', label: '核心优点', trait: '解题破局专长', hint: '决定压轴大题与综合题型的模型破局视角' },
    { key: 'method', label: '教学方法', trait: '认知启发体系', hint: '决定追问启发、数形结合还是逆向秒杀' },
    { key: 'communication', label: '沟通方式', trait: '师生交互频次', hint: '决定是温和鼓励，还是严谨学术探讨' },
  ];

  const modeCards = [
    { key: 'user', label: '自由基因拼接', desc: '挑选五维名师特长', Icon: SlidersIcon },
    { key: 'auto', label: '学情智能匹配', desc: '弱项智能互补补齐', Icon: SparklesIcon },
    { key: 'whole', label: '全量名师克隆', desc: '特级名师基线微调', Icon: DnaIcon },
  ];

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0 64px', position: 'relative' }}>
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {weakKnowledge.length > 0 && (
          <div className="weak-banner">
            本次针对薄弱点：{weakKnowledge.join('、')}
          </div>
        )}
        {/* 顶部标题区 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 10px var(--accent-primary-glow)'
            }} />
            <span>ACADEMIC GENE LAB · 多维名师基因工程</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.14)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <DnaIcon size={20} />
            </div>
            <h1 className="brand-display" style={{ fontSize: '2.1rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              名师多维教学基因合成工坊
            </h1>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            打破名师个体的物理局限，自由重构上课风格、思维方法与人格特质，经 AI 一致性审查生成专属个人虚拟特级名师
          </p>
        </div>

        {/* 核心双栏配置工坊 */}
        <div className="compose-layout">
          {/* 左侧配置矩阵 */}
          <div className="card-impeccable" style={{ padding: '32px', overflow: 'visible' }}>
            {/* 模式选择切换 */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                合成模式选择
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {modeCards.map(m => {
                  const isSelected = mode === m.key;
                  const Icon = m.Icon;
                  return (
                    <button
                      key={m.key}
                      onClick={() => handleModeChange(m.key as any)}
                      style={{
                        padding: '16px 14px',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'left',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                        background: isSelected ? 'var(--card-bg)' : 'var(--bg-surface)',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        cursor: 'pointer',
                        transition: 'all var(--trans-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={16} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {m.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
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
                onChange={e => {
                  setSynthName(e.target.value);
                  triggerSynthesize(selections, e.target.value, mode);
                }}
                placeholder="为即将诞生的专属名师命名..."
                className="input-luxury"
                style={{ padding: '12px 18px', fontSize: '0.94rem' }}
              />
            </div>

            {/* 五维度精调矩阵 (全新垂直排布卡片，彻底根除文字挤压折断) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-body)' }}>
                  <SlidersIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
                  <span>五维教学基因精构矩阵</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  实时合成预测已就绪
                </span>
              </div>

              {dimensionRows.map((row, idx) => (
                <div
                  key={row.key}
                  style={{
                    padding: '14px 18px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    zIndex: 20 - idx
                  }}
                >
                  {/* 维度头部：标签 + 教学价值简述 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {row.trait}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {row.hint}
                    </span>
                  </div>

                  {/* 对应名师全宽选择器 (高对比度主题自适应卡片组件，彻底根除白底白字) */}
                  <GeneDropdown
                    value={selections[row.key] || 't1'}
                    onChange={val => handleSelectionChange(row.key, val)}
                    options={catalog}
                    dimensionKey={row.key}
                  />
                </div>
              ))}
            </div>

            {/* 提交合成行动按钮 */}
            <button
              onClick={handleSynthesize}
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <SparklesIcon size={18} />
              <span>{loading ? '正在执行基因融合与一致性审查...' : savedSuccess ? '✓ 已成功生成并持久化入库！' : '保存专属名师档案入库'}</span>
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  color: 'var(--accent-primary)'
                }}>
                  <DnaIcon size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '18px', fontWeight: 800 }}>
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
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>我已保存的虚拟名师 ({historySynths.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historySynths.map((h, i) => (
                    <div
                      key={h.id || i}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
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
        <div className="next-bar">
          <button type="button" className="btn btn-primary" onClick={() => currentRecipe && onOpenStudio(currentRecipe)}>
            去微课呈现
          </button>
        </div>
      </div>
    </div>
  );
};
