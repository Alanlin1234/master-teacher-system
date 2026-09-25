import React from 'react';

interface Props {
  content: string;
}

export const RichMarkdown: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  // 简易但高保真的教学富文本解析器 (支持 LaTeX 公式排版展示、标题、列表、粗体、提示块)
  const lines = content.split('\n');

  return (
    <div style={{ fontSize: '0.94rem', lineHeight: '1.7', color: 'var(--text-body)' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 块级公式 $$ ... $$
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
          const formula = trimmed.slice(2, -2).trim();
          return (
            <div
              key={idx}
              style={{
                margin: '12px 0',
                padding: '10px 16px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                fontFamily: 'serif',
                fontSize: '1.08rem',
                color: 'var(--navy-blue)',
                border: '1px solid var(--border-light)'
              }}
            >
              {formula}
            </div>
          );
        }

        // 标题 H3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ margin: '14px 0 6px', color: 'var(--navy-deep)', fontWeight: 700 }}>
              {trimmed.slice(4)}
            </h4>
          );
        }

        // 引用块 / 名师点睛
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              style={{
                margin: '10px 0',
                padding: '8px 14px',
                borderLeft: '4px solid var(--cyan-accent)',
                background: 'var(--cyan-light)',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.88rem',
                color: '#0e7490'
              }}
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        // 无序列表
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ paddingLeft: '18px', position: 'relative', margin: '4px 0' }}>
              <span style={{ position: 'absolute', left: '4px', color: 'var(--blue-primary)' }}>•</span>
              <span>{formatInlineMath(trimmed.slice(2))}</span>
            </div>
          );
        }

        // 有序列表
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={idx} style={{ margin: '4px 0', paddingLeft: '6px' }}>
              <span>{formatInlineMath(trimmed)}</span>
            </div>
          );
        }

        // 空行
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        // 普通正文段落
        return (
          <p key={idx} style={{ margin: '4px 0' }}>
            {formatInlineMath(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// 行内公式与高亮处理
function formatInlineMath(text: string): React.ReactNode {
  // 处理粗体 **text**
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--navy-deep)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return (
        <span
          key={i}
          style={{
            fontFamily: 'serif',
            color: 'var(--navy-blue)',
            background: 'var(--bg-subtle)',
            padding: '1px 5px',
            borderRadius: '4px',
            margin: '0 2px'
          }}
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
