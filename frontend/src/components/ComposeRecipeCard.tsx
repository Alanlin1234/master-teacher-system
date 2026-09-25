import React from 'react';
import { RadarChart5D } from './RadarChart5D';
import {
  DnaIcon,
  ShieldCheckIcon,
  CheckIcon,
  MessageSquareIcon,
  VideoCameraIcon,
} from './Icons';

interface Props {
  recipe: any;
  onStartChat?: () => void;
  onOpenStudio?: () => void;
}

export const ComposeRecipeCard: React.FC<Props> = ({ recipe, onStartChat, onOpenStudio }) => {
  if (!recipe) return null;

  const dims = recipe.dimensions || {};
  const radarScores = recipe.predicted_radar || {};
  const consistency = Math.round((recipe.consistency_score || 0.9) * 100);

  return (
    <div className="card-impeccable" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
      {/* 头部标题与一致性标签 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-neon)'
            }}>
              <DnaIcon size={18} />
            </div>
            <h3 style={{ fontSize: '1.28rem', color: '#ffffff', fontWeight: 800 }}>
              {recipe.name}
            </h3>
            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
              虚拟合成名师
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            编号：{recipe.id} · 模式：{recipe.mode === 'user' ? '自由基因拼接' : recipe.mode === 'auto' ? '学情智能匹配' : '全量克隆'}
          </p>
        </div>

        {/* 一致性评分胶囊 */}
        <div style={{
          textAlign: 'right',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(37, 99, 235, 0.25))',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--cyan-neon)', fontWeight: 600 }}>五维融合一致性</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
            {consistency}%
          </div>
        </div>
      </div>

      {/* 中部双栏：左侧五维基因来源列表，右侧预测雷达 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'center' }}>
        {/* 左侧维度细目 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(dims).map(([key, val]: [string, any]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem'
              }}
            >
              <span style={{ fontWeight: 700, color: '#ffffff' }}>
                {val.dimension_name || key}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  源自：{val.teacher_name}
                </span>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                  已融合
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧预测雷达图 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarChart5D scores={radarScores} size={210} showLabels={true} highlightColor="#38bdf8" />
        </div>
      </div>

      {/* AI 审查日志 (Critic Notes) */}
      {recipe.critic_notes && recipe.critic_notes.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cyan-neon)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheckIcon size={14} />
            <span>智能一致性审核报告 (AI Critic)</span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recipe.critic_notes.map((note: string, idx: number) => (
              <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-body)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckIcon size={12} style={{ color: 'var(--emerald-neon)' }} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 底部行动栏 */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
        {onStartChat && (
          <button onClick={onStartChat} className="btn btn-primary" style={{ fontSize: '0.86rem', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquareIcon size={14} />
            <span>发起1对1专属辅导</span>
          </button>
        )}
        {onOpenStudio && (
          <button onClick={onOpenStudio} className="btn btn-secondary" style={{ fontSize: '0.86rem', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <VideoCameraIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
            <span>导入微课生成工坊</span>
          </button>
        )}
      </div>
    </div>
  );
};
