import React, { useState } from 'react';
import katex from 'katex';

interface Props {
  content: string;
}

/** 渲染 KaTeX 公式 (支持异常安全回退) */
function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      strict: false
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
    return `<span class="katex-error" style="color: #ef4444; font-family: monospace;">${latex}</span>`;
  }
}

/** 独立块级公式卡片组件 (带复制与板书黑板视觉) */
const BlockMathCard: React.FC<{ formula: string; idx: number }> = ({ formula, idx }) => {
  const [copied, setCopied] = useState(false);
  const html = renderKatex(formula, true);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      key={idx}
      style={{
        margin: '16px 0',
        borderRadius: '10px',
        background: '#070b14',
        border: '1px solid rgba(217, 119, 6, 0.22)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 顶部微工具条 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        background: 'rgba(217, 119, 6, 0.06)',
        borderBottom: '1px solid rgba(217, 119, 6, 0.12)',
        fontSize: '0.72rem',
        color: 'var(--accent-gold)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, letterSpacing: '0.04em' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-gold)' }} />
          <span>名师学术板书 · LaTeX 标准推演</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '4px',
            color: copied ? '#34d399' : 'var(--text-muted)',
            padding: '2px 8px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {copied ? '✓ 已复制源码' : '复制公式'}
        </button>
      </div>

      {/* 核心公式渲染区 */}
      <div
        style={{
          padding: '16px 20px',
          overflowX: 'auto',
          color: '#f8fafc',
          fontSize: '1.08rem',
          textAlign: 'center'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export const RichMarkdown: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  // 将文本按行与多行公式块切分
  const lines = content.split('\n');

  return (
    <div className="rich-academic-markdown" style={{ fontSize: '0.94rem', lineHeight: '1.75', color: 'var(--text-body)' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 块级公式 $$ ... $$ (同行包裹)
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
          const formula = trimmed.slice(2, -2).trim();
          return <BlockMathCard key={idx} formula={formula} idx={idx} />;
        }

        // 标题 H3 ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="brand-serif"
              style={{
                margin: '18px 0 8px',
                color: 'var(--accent-gold)',
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>✦</span>
              <span>{trimmed.slice(4)}</span>
            </h4>
          );
        }

        // 标题 H4 ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h5
              key={idx}
              className="brand-serif"
              style={{
                margin: '14px 0 6px',
                color: '#ffffff',
                fontSize: '1.0rem',
                fontWeight: 600
              }}
            >
              {trimmed.slice(5)}
            </h5>
          );
        }

        // 引用块 / 名师点睛
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              style={{
                margin: '12px 0',
                padding: '10px 16px',
                borderLeft: '3px solid var(--accent-gold)',
                background: 'rgba(217, 119, 6, 0.06)',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.9rem',
                color: '#fed7aa'
              }}
            >
              {formatInlineContent(trimmed.slice(2))}
            </blockquote>
          );
        }

        // 无序列表
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ paddingLeft: '20px', position: 'relative', margin: '6px 0' }}>
              <span style={{ position: 'absolute', left: '6px', color: 'var(--accent-gold)', top: '1px' }}>•</span>
              <span>{formatInlineContent(trimmed.slice(2))}</span>
            </div>
          );
        }

        // 有序列表
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+\.)\s(.*)$/);
          if (match) {
            return (
              <div key={idx} style={{ margin: '6px 0', paddingLeft: '8px', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, flexShrink: 0 }}>{match[1]}</span>
                <div>{formatInlineContent(match[2])}</div>
              </div>
            );
          }
        }

        // 空行
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        // 普通正文段落
        return (
          <p key={idx} style={{ margin: '6px 0' }}>
            {formatInlineContent(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/** 解析行内 Markdown 与行内 KaTeX 公式 */
function formatInlineContent(text: string): React.ReactNode {
  // 匹配 $...$ 行内数学公式 或 **...** 粗体
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$]+\$)/g);

  return parts.map((part, i) => {
    // 粗体
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    // 行内数学公式 $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const latex = part.slice(1, -1);
      const mathHtml = renderKatex(latex, false);
      return (
        <span
          key={i}
          className="inline-math-wrap"
          style={{
            display: 'inline-block',
            padding: '0 4px',
            margin: '0 2px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            verticalAlign: 'baseline'
          }}
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />
      );
    }
    return part;
  });
}
