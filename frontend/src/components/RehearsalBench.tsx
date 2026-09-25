import React, { useState } from 'react';
import { RichMarkdown } from './RichMarkdown';
import { teachersApi } from '../services/api';

const TOPICS = [
  { id: 'math', label: '高中数学', question: '为什么导数等于 0 只是极值点的必要条件，而不是充分条件？' },
  { id: 'physics', label: '高中物理', question: '电磁感应双棒问题里，系统稳态速度如何由动量守恒得到？' },
  { id: 'chinese', label: '高中文科', question: '《赤壁赋》如何由水与月的变与不变写出旷达？' },
];

export const RehearsalBench: React.FC = () => {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [question, setQuestion] = useState(TOPICS[0].question);
  const [answer, setAnswer] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [scores, setScores] = useState({ style: 0.9, method: 0.86, strengths: 0.9, personality: 0.8, communication: 0.84 });

  const run = async () => {
    if (!question.trim() || streaming) return;
    setStreaming(true);
    setAnswer('');
    let acc = '';
    try {
      await teachersApi.streamChat(
        'synth',
        [{ role: 'user', content: question.trim() }],
        {
          name: `五维自适应名师（${topic.label}）`,
          subject: topic.label,
          dim_scores: scores,
          initialQuestion: question.trim(),
        },
        (delta) => {
          acc += delta;
          setAnswer(acc);
        },
        () => setStreaming(false),
        () => setStreaming(false),
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <section style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-glass)' }}>
      <h2 style={{ fontSize: 'var(--text-xl)', letterSpacing: '-0.03em' }}>名师答疑演练</h2>
      <div className="segmented" style={{ margin: '12px 0' }}>
        {TOPICS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={topic.id === item.id ? 'page' : undefined}
            onClick={() => { setTopic(item); setQuestion(item.question); setAnswer(''); }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
        {(Object.keys(scores) as Array<keyof typeof scores>).map((key) => (
          <label key={key} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {key}
            <input
              type="range"
              min={50}
              max={100}
              value={Math.round(scores[key] * 100)}
              onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) / 100 }))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </label>
        ))}
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border-glass)', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: 12, font: 'inherit' }}
      />
      <button type="button" className="btn btn-primary" style={{ marginTop: 10 }} disabled={streaming} onClick={run}>
        {streaming ? '正在生成' : '按当前基因生成'}
      </button>
      {streaming && !answer && <span className="status-beacon" style={{ background: 'var(--accent-primary)', marginLeft: 12, display: 'inline-block' }} />}
      {answer && (
        <div style={{ marginTop: 16, maxHeight: 420, overflow: 'auto' }}>
          <RichMarkdown content={answer} />
        </div>
      )}
    </section>
  );
};
