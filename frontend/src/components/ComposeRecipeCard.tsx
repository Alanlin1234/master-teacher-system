import React from 'react';
import { RadarChart5D } from './RadarChart5D';
import {
  DnaIcon,
  ShieldCheckIcon,
  CheckIcon,
  MessageSquareIcon,
  VideoCameraIcon,
  SparklesIcon,
} from './Icons';

interface Props {
  recipe: any;
  onStartChat?: () => void;
  onOpenStudio?: () => void;
}

export const ComposeRecipeCard: React.FC<Props> = ({ recipe, onStartChat, onOpenStudio }) => {
  if (!recipe) return null;

  const dims = recipe.dimensions || {};
  const radarScores = recipe.predicted_radar || recipe.radar || {};
  const consistency = Math.round((recipe.consistency_score || 0.94) * 100);
  const avatarUrl = recipe.photoUrl ? (recipe.photoUrl.startsWith('/') ? '.' + recipe.photoUrl : recipe.photoUrl) : './avatars/t1.svg';

  return (
    <div className="card-impeccable" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
      {/* 头部身份铭牌 (名师头像 + 称号 + 一致性得分胶囊) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-glass)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* 头像徽章 */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'radial-gradient(circle at 50% 35%, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            flexShrink: 0
          }}>
            <img
              src={avatarUrl}
              alt=""
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = './avatars/t1.svg'; }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {recipe.name}
              </h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                AI 特级导师
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ID: {recipe.id} · {recipe.mode === 'user' ? '自由基因拼接' : recipe.mode === 'auto' ? '学情智能匹配' : '全量克隆'}
            </p>
          </div>
        </div>

        {/* 一致性指数度量胶囊 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(37, 99, 235, 0.2))',
          padding: '8px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          boxShadow: '0 0 16px rgba(56, 189, 248, 0.15)'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--cyan-neon)', fontWeight: 600, letterSpacing: '0.04em' }}>
            五维融合一致性
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }} className="tabular-nums">
            {consistency}%
          </div>
        </div>
      </div>

      {/* 专区一：五维教学能力拓扑雷达图 (独立居中，宽敞呼吸空间，杜绝边角挤压) */}
      <div style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.5) 70%, transparent 100%)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 12px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '0.76rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          5D CAPABILITY TOPOLOGY · 教学能力预测图谱
        </div>
        <RadarChart5D scores={radarScores} size={230} showLabels={true} highlightColor="#38bdf8" />
      </div>

      {/* 专区二：五维基因溯源谱系 (独立展开，文字绝不折行截断) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DnaIcon size={14} style={{ color: 'var(--cyan-neon)' }} />
          <span>五维基因重组谱系</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(dims).map(([key, val]: [string, any]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {val.dimension_name || key}
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {val.teacher_name}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {val.content ? `· ${val.content}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>已融合</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 专区三：AI Critic 智能一致性审计报告 */}
      {recipe.critic_notes && recipe.critic_notes.length > 0 && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '22px'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--emerald-neon)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheckIcon size={14} />
            <span>智能一致性审核报告 (AI Critic)</span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {recipe.critic_notes.map((note: string, idx: number) => (
              <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-body)', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: 1.5 }}>
                <CheckIcon size={13} style={{ color: 'var(--emerald-neon)', marginTop: '2px', flexShrink: 0 }} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 底部高权重行动栏 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {onStartChat && (
          <button
            onClick={onStartChat}
            className="btn btn-primary"
            style={{ fontSize: '0.88rem', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <MessageSquareIcon size={15} />
            <span>1对1 专属伴学</span>
          </button>
        )}
        {onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className="btn btn-secondary"
            style={{ fontSize: '0.88rem', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <VideoCameraIcon size={15} style={{ color: 'var(--cyan-neon)' }} />
            <span>生成数字人微课</span>
          </button>
        )}
      </div>
    </div>
  );
};
