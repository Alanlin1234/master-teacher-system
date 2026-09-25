import React, { useState } from 'react';
import katex from 'katex';
import { SparklesIcon, CheckIcon, AlertCircleIcon } from './Icons';

interface Props {
  content: string;
}

/**
 * 渲染 KaTeX 印刷级数学公式
 * 支持智能识别多行公式换行符 '\\' 并自动包裹 aligned 环境，杜绝语法解析错误
 */
function renderKatex(latex: string, displayMode: boolean): string {
  let clean = latex.trim();
  if (!clean) return '';

  // 若为块级公式且包含换行符 '\\' 但未包裹数学矩阵环境，自动注入 aligned 结构确保换行渲染
  if (displayMode && clean.includes('\\\\') && !clean.includes('\\begin{')) {
    clean = `\\begin{aligned} ${clean} \\end{aligned}`;
  }

  try {
    return katex.renderToString(clean, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch (err) {
    try {
      // 若 aligned 结构导致未知异常，优雅回退至原始公式渲染
      return katex.renderToString(latex.trim(), {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      console.warn("KaTeX render error:", e);
      return `<span class="katex-error" style="color: var(--accent-primary); font-family: monospace;">${latex}</span>`;
    }
  }
}

/**
 * 独立块级公式卡片组件 (名师板书 LaTeX 视觉)
 * 昼夜自适应：浅色模式下为柔和纸质板书，深色模式下为深邃黑金板书
 */
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
        margin: '18px 0',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* 顶部学术推演工具条 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-glass)',
          fontSize: '0.74rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.02em' }}>
          <SparklesIcon size={14} />
          <span>名师学术板书 · LaTeX 标准推演</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
            border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)'}`,
            borderRadius: 'var(--radius-xs)',
            color: copied ? '#10b981' : 'var(--text-muted)',
            padding: '3px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? (
            <>
              <CheckIcon size={12} />
              <span>已复制 LaTeX 源码</span>
            </>
          ) : (
            <span>复制公式源码</span>
          )}
        </button>
      </div>

      {/* 核心公式渲染区：颜色严格绑定 var(--text-main)，确保深浅模式均清晰锐利 */}
      <div
        style={{
          padding: '20px 24px',
          overflowX: 'auto',
          color: 'var(--text-main)',
          fontSize: '1.08rem',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

/**
 * 特色名师教学展台卡片 (支持启发思考、要点点拨、易错警示与学术典藏)
 */
const CalloutCard: React.FC<{
  variant: 'think' | 'tip' | 'warning' | 'quote';
  title?: string;
  content: string[];
  idx: number;
}> = ({ variant, title, content, idx }) => {
  const configs = {
    think: {
      borderColor: 'var(--accent-primary)',
      accentColor: 'var(--accent-primary)',
      badgeBg: 'rgba(37, 99, 235, 0.1)',
      bgLight: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(99, 102, 241, 0.03) 100%)',
      defaultTitle: '✦ 启发思考 · 深度探究',
      icon: '✦',
    },
    tip: {
      borderColor: '#10b981',
      accentColor: '#059669',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      bgLight: 'rgba(16, 185, 129, 0.05)',
      defaultTitle: '🎯 名师点拨 · 核心关键',
      icon: '🎯',
    },
    warning: {
      borderColor: '#f59e0b',
      accentColor: '#d97706',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      bgLight: 'rgba(245, 158, 11, 0.06)',
      defaultTitle: '⚠️ 易错陷阱 · 考点破译',
      icon: '⚠️',
    },
    quote: {
      borderColor: 'var(--accent-primary)',
      accentColor: 'var(--text-muted)',
      badgeBg: 'var(--bg-subtle)',
      bgLight: 'var(--bg-surface-elevated)',
      defaultTitle: '名师学思录',
      icon: '❝',
    },
  }[variant];

  return (
    <div
      key={idx}
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: configs.bgLight,
        border: '1px solid var(--border-glass)',
        borderLeft: `4px solid ${configs.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* 卡片头部标识 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 800,
          fontSize: '0.86rem',
          color: configs.accentColor,
          marginBottom: '10px',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{configs.icon}</span>
        <span>{title || configs.defaultTitle}</span>
      </div>

      {/* 正文：坚决使用 var(--text-main)，彻底铲除淡黄/淡橙等看不清字迹的问题！ */}
      <div
        style={{
          fontSize: '0.92rem',
          color: 'var(--text-main)',
          lineHeight: '1.75',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {content.map((p, pIdx) => (
          <div key={pIdx}>{formatInlineContent(p)}</div>
        ))}
      </div>
    </div>
  );
};

/**
 * 结构化学术对比表格组件
 */
const TableCard: React.FC<{ headers: string[]; rows: string[][]; idx: number }> = ({ headers, rows, idx }) => {
  return (
    <div
      key={idx}
      style={{
        margin: '18px 0',
        overflowX: 'auto',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-glass)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '10px 16px', fontWeight: 750, color: 'var(--text-main)' }}>
                {formatInlineContent(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--border-glass)',
                background: ri % 2 === 1 ? 'var(--bg-subtle)' : 'transparent',
              }}
            >
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '10px 16px', color: 'var(--text-body)', lineHeight: '1.55' }}>
                  {formatInlineContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * 解析并格式化行内 Markdown：
 * 包含代码胶囊、粗体（高对比度）、行内 KaTeX 公式
 */
function formatInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  // 匹配行内代码 `...`、粗体 **...**、多字行内公式 $$...$$ 与 $...$
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\$\$[^$]+\$\$|\$[^$\n]+\$)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. 代码胶囊
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          style={{
            padding: '2px 6px',
            margin: '0 2px',
            borderRadius: '4px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-glass)',
            color: 'var(--accent-primary)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.86em',
            fontWeight: 600,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. 粗体：严格使用 var(--text-main)（浅色下为深墨黑，深色下为纯白），杜绝硬编码 #ffffff 导致隐形！
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong
          key={i}
          style={{
            color: 'var(--text-main)',
            fontWeight: 750,
          }}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 3. 行内块级公式 $$...$$
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      const latex = part.slice(2, -2);
      const mathHtml = renderKatex(latex, true);
      return (
        <span
          key={i}
          className="inline-display-math-wrap"
          style={{
            display: 'inline-block',
            padding: '2px 6px',
            margin: '2px 0',
            color: 'var(--text-main)',
            verticalAlign: 'middle',
          }}
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />
      );
    }

    // 4. 标准行内公式 $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const latex = part.slice(1, -1);
      const mathHtml = renderKatex(latex, false);
      return (
        <span
          key={i}
          className="inline-math-wrap"
          style={{
            display: 'inline-block',
            padding: '0 3px',
            margin: '0 1px',
            color: 'var(--text-main)',
            verticalAlign: 'baseline',
          }}
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />
      );
    }

    // 普通正文文字
    return part;
  });
}

// 块级语法抽象模型
type AcademicBlock =
  | { type: 'math'; formula: string }
  | { type: 'callout'; variant: 'think' | 'tip' | 'warning' | 'quote'; title?: string; content: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list-ol'; items: { num: string; text: string }[] }
  | { type: 'list-ul'; items: string[] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'divider' }
  | { type: 'paragraph'; text: string };

/**
 * 工业级 Markdown 块扫描状态机
 * 完美支持多行 $$...$$ 跨行公式块切分、代码块提取与多维教学展台
 */
function parseAcademicBlocks(content: string): AcademicBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: AcademicBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. 单行块级公式 $$ formula $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      blocks.push({ type: 'math', formula: trimmed.slice(2, -2).trim() });
      i++;
      continue;
    }

    // 2. 多行块级公式 $$ \n ... \n $$ (彻底修复图二公式未渲染的根本原因)
    if (trimmed.startsWith('$$')) {
      const formulaLines: string[] = [];
      const firstLineContent = trimmed.slice(2).trim();
      if (firstLineContent) formulaLines.push(firstLineContent);
      i++;

      let foundClose = false;
      while (i < lines.length) {
        const curTrimmed = lines[i].trim();
        if (curTrimmed.endsWith('$$')) {
          const lastLineContent = curTrimmed.slice(0, -2).trim();
          if (lastLineContent) formulaLines.push(lastLineContent);
          foundClose = true;
          i++;
          break;
        }
        formulaLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'math', formula: formulaLines.join('\n').trim() });
      continue;
    }

    // 3. LaTeX 备用块级语法 \\[ ... \\]
    if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 2) {
      blocks.push({ type: 'math', formula: trimmed.slice(2, -2).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('\\[')) {
      const formulaLines: string[] = [];
      const firstLineContent = trimmed.slice(2).trim();
      if (firstLineContent) formulaLines.push(firstLineContent);
      i++;

      while (i < lines.length) {
        const curTrimmed = lines[i].trim();
        if (curTrimmed.endsWith('\\]')) {
          const lastLineContent = curTrimmed.slice(0, -2).trim();
          if (lastLineContent) formulaLines.push(lastLineContent);
          i++;
          break;
        }
        formulaLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'math', formula: formulaLines.join('\n').trim() });
      continue;
    }

    // 4. 代码块 ```lang ... ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        if (lines[i].trim().startsWith('```')) {
          i++;
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    // 5. 标题：H3 ### 与 H4 ####
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'heading', level: 4, text: trimmed.slice(5).trim() });
      i++;
      continue;
    }

    // 6. 分割线 --- 或 ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 7. 特色展示形式：启发思考 / 要点点拨 / 易错警示 / 引用卡片 (支持图三丰富形态)
    const isQuoteLine = trimmed.startsWith('>');
    const isThinkSpecial =
      trimmed.startsWith('✦ 启发思考') ||
      trimmed.startsWith('💡 启发思考') ||
      trimmed.startsWith('🤔 深度思考') ||
      trimmed.startsWith('【启发思考】') ||
      trimmed.startsWith('【深度探究】');

    if (isQuoteLine || isThinkSpecial) {
      const calloutLines: string[] = [];
      const initialText = isQuoteLine ? trimmed.replace(/^>\s?/, '') : trimmed;
      if (initialText) calloutLines.push(initialText);
      i++;

      while (i < lines.length) {
        const nextTrimmed = lines[i].trim();
        if (isQuoteLine && nextTrimmed.startsWith('>')) {
          calloutLines.push(nextTrimmed.replace(/^>\s?/, ''));
          i++;
        } else if (!isQuoteLine && nextTrimmed && !nextTrimmed.startsWith('#') && !nextTrimmed.startsWith('$$') && !/^\d+\.\s/.test(nextTrimmed) && !nextTrimmed.startsWith('- ')) {
          calloutLines.push(nextTrimmed);
          i++;
        } else {
          break;
        }
      }

      const fullCombined = calloutLines.join(' ');
      let variant: 'think' | 'tip' | 'warning' | 'quote' = 'quote';
      let title = '名师学思录';

      if (
        fullCombined.includes('启发思考') ||
        fullCombined.includes('思考') ||
        fullCombined.includes('探究') ||
        fullCombined.includes('为何') ||
        fullCombined.includes('假定') ||
        /\[!THINK\]/i.test(fullCombined)
      ) {
        variant = 'think';
        title = '✦ 启发思考 · 深度探究';
      } else if (
        fullCombined.includes('易错') ||
        fullCombined.includes('陷阱') ||
        fullCombined.includes('避坑') ||
        fullCombined.includes('注意') ||
        fullCombined.includes('失分') ||
        /\[!(WARNING|IMPORTANT|CAUTION)\]/i.test(fullCombined)
      ) {
        variant = 'warning';
        title = '⚠️ 易错陷阱 · 考点破译';
      } else if (
        fullCombined.includes('名师点拨') ||
        fullCombined.includes('点拨') ||
        fullCombined.includes('技巧') ||
        fullCombined.includes('口诀') ||
        fullCombined.includes('秒杀') ||
        /\[!(NOTE|TIP)\]/i.test(fullCombined)
      ) {
        variant = 'tip';
        title = '🎯 特级名师 · 要点点拨';
      }

      // 剔除裸露的 [!IMPORTANT] 等 GitHub alert 标签，杜绝渲染杂质
      const cleanedContent = calloutLines
        .map(line => line.replace(/^\[!(IMPORTANT|NOTE|WARNING|TIP|CAUTION|THINK)\]\s*/i, '').trim())
        .filter(Boolean);

      blocks.push({
        type: 'callout',
        variant,
        title,
        content: cleanedContent,
      });
      continue;
    }

    // 8. 步骤序号列表 1. 2. 3.
    if (/^\d+\.\s/.test(trimmed)) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const curTrimmed = lines[i].trim();
        const match = curTrimmed.match(/^(\d+\.)\s*(.*)$/);
        if (match) {
          items.push({ num: match[1], text: match[2] });
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list-ol', items });
      continue;
    }

    // 9. 无序项目符号列表 - 或 *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length) {
        const curTrimmed = lines[i].trim();
        if (curTrimmed.startsWith('- ') || curTrimmed.startsWith('* ')) {
          items.push(curTrimmed.slice(2).trim());
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list-ul', items });
      continue;
    }

    // 10. Markdown 结构化表格
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) => r.split('|').slice(1, -1).map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        const dataRows = tableLines.slice(2).map(parseRow);
        blocks.push({ type: 'table', headers, rows: dataRows });
        continue;
      }
    }

    // 11. 空行
    if (!trimmed) {
      i++;
      continue;
    }

    // 12. 默认普通正文段落
    blocks.push({ type: 'paragraph', text: trimmed });
    i++;
  }

  return blocks;
}

export const RichMarkdown: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  const blocks = parseAcademicBlocks(content);

  return (
    <div className="rich-academic-markdown" style={{ fontSize: '0.94rem', lineHeight: '1.75', color: 'var(--text-body)' }}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'math':
            return <BlockMathCard key={idx} formula={block.formula} idx={idx} />;

          case 'callout':
            return (
              <CalloutCard
                key={idx}
                variant={block.variant}
                title={block.title}
                content={block.content}
                idx={idx}
              />
            );

          case 'table':
            return <TableCard key={idx} headers={block.headers} rows={block.rows} idx={idx} />;

          case 'list-ol':
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                {block.items.map((item, itemIdx) => (
                  <div key={itemIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: 'rgba(37, 99, 235, 0.1)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {item.num.replace('.', '')}
                    </span>
                    <div style={{ flex: 1, color: 'var(--text-body)', lineHeight: '1.65' }}>
                      {formatInlineContent(item.text)}
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'list-ul':
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
                {block.items.map((it, itemIdx) => (
                  <div key={itemIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingLeft: '4px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', marginTop: '-1px' }}>•</span>
                    <div style={{ flex: 1, color: 'var(--text-body)', lineHeight: '1.65' }}>
                      {formatInlineContent(it)}
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'heading':
            if (block.level === 3) {
              return (
                <div
                  key={idx}
                  style={{
                    margin: '22px 0 10px',
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid var(--border-glass)',
                    paddingBottom: '6px',
                  }}
                >
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.92rem' }}>✦</span>
                  <span>{formatInlineContent(block.text)}</span>
                </div>
              );
            }
            return (
              <div
                key={idx}
                style={{
                  margin: '16px 0 8px',
                  fontSize: '0.98rem',
                  fontWeight: 750,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                <span>{formatInlineContent(block.text)}</span>
              </div>
            );

          case 'code':
            return (
              <div
                key={idx}
                style={{
                  margin: '14px 0',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-glass)',
                  overflow: 'hidden',
                }}
              >
                {block.language && (
                  <div
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-glass)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {block.language}
                  </div>
                )}
                <pre
                  style={{
                    margin: 0,
                    padding: '14px 18px',
                    overflowX: 'auto',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.86rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.6',
                  }}
                >
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case 'divider':
            return (
              <hr
                key={idx}
                style={{
                  margin: '18px 0',
                  border: 'none',
                  borderTop: '1px solid var(--border-glass)',
                }}
              />
            );

          case 'paragraph':
          default:
            return (
              <p key={idx} style={{ margin: '8px 0' }}>
                {formatInlineContent(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
