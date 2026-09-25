import React, { useState, useEffect, useRef } from 'react';
import { teachersApi } from '../services/api';
import { speechService } from '../services/speech';
import { TeacherDigitalHuman, AvatarState } from '../components/TeacherDigitalHuman';
import { RichMarkdown } from '../components/RichMarkdown';
import {
  MessageSquareIcon,
  VideoCameraIcon,
  VolumeIcon,
  ArrowRightIcon,
  SendIcon,
  AlertCircleIcon,
} from '../components/Icons';

interface Props {
  initialTeacherId?: string;
  synthRecipe?: any;
  onExportToStudio?: (script: string, topic: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const TeacherChatPage: React.FC<Props> = ({
  initialTeacherId = 't1',
  synthRecipe,
  onExportToStudio,
}) => {
  const [teacher, setTeacher] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [caption, setCaption] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const promptPills = [
    '请老师用数形结合法拆解导数切线综合题',
    '这道高考压轴题第二问有什么秒杀口诀？',
    '能不能帮我出两道同构变式题巩固一下？',
    '这段文言文虚词“之”的用法如何快速区分？',
  ];

  useEffect(() => {
    loadTeacherInfo();
  }, [initialTeacherId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadTeacherInfo = async () => {
    try {
      const res = await teachersApi.getDetail(initialTeacherId);
      if (res.ok) {
        setTeacher(res.teacher);
        const greeting = synthRecipe
          ? `同学你好！我是为你专属定制的虚拟名师【${synthRecipe.name}】。我融汇了各位特级名师的教学风格与思维方法，今天咱们来攻克什么难题？`
          : `同学你好！我是【${res.teacher.name}】，主讲高中${res.teacher.subject}。${res.teacher.style}。有什么不懂的概念或者卡壳的题型，随时问我！`;

        setMessages([{ role: 'assistant', content: greeting }]);
        if (voiceOn) {
          setCaption(greeting);
          setAvatarState('speaking');
          speechService.speak(
            greeting,
            () => setAvatarState('speaking'),
            () => setAvatarState('idle')
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMsgs);
    setIsLoading(true);
    setAvatarState('thinking');

    let assistantReply = '';
    const tempIndex = newMsgs.length;

    // 预先占位 assistant 消息
    setMessages([...newMsgs, { role: 'assistant', content: '' }]);

    await teachersApi.streamChat(
      initialTeacherId,
      newMsgs,
      synthRecipe,
      (delta: string) => {
        assistantReply += delta;
        setAvatarState('speaking');
        setCaption(assistantReply.slice(-60));
        setMessages(prev => {
          const copy = [...prev];
          copy[tempIndex] = { role: 'assistant', content: assistantReply };
          return copy;
        });
      },
      () => {
        setIsLoading(false);
        // 如果开启语音，朗读回答内容
        if (voiceOn && assistantReply) {
          speechService.speak(
            assistantReply,
            () => setAvatarState('speaking'),
            () => setAvatarState('idle')
          );
        } else {
          setAvatarState('idle');
        }
      },
      (err: Error) => {
        setIsLoading(false);
        setAvatarState('idle');
        setMessages(prev => {
          const copy = [...prev];
          copy[tempIndex] = { role: 'assistant', content: `连接异常: ${err.message}` };
          return copy;
        });
      }
    );
  };

  const handleExportChat = () => {
    const fullScript = messages
      .map(m => `${m.role === 'user' ? '学生提问' : '名师讲解'}：\n${m.content}\n`)
      .join('\n');
    const topic = messages.find(m => m.role === 'user')?.content.slice(0, 20) || '名师重点微课';
    onExportToStudio?.(fullScript, topic);
  };

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', padding: '28px 0 44px', position: 'relative' }}>
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部标题与行动中枢 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <MessageSquareIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.45rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {synthRecipe ? synthRecipe.name : teacher ? `${teacher.name} · 1对1深度互动课堂` : '名师伴学'}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {teacher?.style} · 支持 LaTeX 公式实时渲染与多模态超清数字人伴学
              </div>
            </div>
          </div>

          <button
            onClick={handleExportChat}
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '7px' }}
            title="将本次问答记录转化为微课脚本"
          >
            <VideoCameraIcon size={15} style={{ color: 'var(--cyan-neon)' }} />
            <span>导出为微课脚本</span>
            <ArrowRightIcon size={13} />
          </button>
        </div>

        {/* 双栏工作台：左侧问答交互流，右侧数字人展台 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 370px',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* 左侧聊天流 */}
          <div className="card-impeccable" style={{
            height: '670px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* 消息滚动区 */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: 'rgba(11, 17, 32, 0.4)'
            }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginBottom: '5px' }}>
                    {m.role === 'user' ? '我' : teacher?.name || '名师导师'}
                  </div>

                  <div style={{
                    maxWidth: '85%',
                    padding: '14px 18px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: m.role === 'user' ? '#ffffff' : '#f8fafc',
                    boxShadow: m.role === 'user'
                      ? '0 0 20px -4px rgba(37, 99, 235, 0.5)'
                      : 'var(--shadow-sm)',
                    border: m.role === 'user'
                      ? '1px solid rgba(255, 255, 255, 0.2)'
                      : '1px solid var(--border-glass)'
                  }}>
                    {m.role === 'user' ? (
                      <div style={{ fontSize: '0.94rem', lineHeight: '1.6' }}>{m.content}</div>
                    ) : (
                      <RichMarkdown content={m.content} />
                    )}
                  </div>

                  {m.role === 'assistant' && m.content && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => speechService.speak(m.content, () => setAvatarState('speaking'), () => setAvatarState('idle'))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cyan-neon)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <VolumeIcon size={13} />
                        <span>重听播报</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* 启发式提问胶囊 Pills */}
            <div style={{
              padding: '12px 18px',
              background: 'rgba(15, 23, 42, 0.7)',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
                启发提问：
              </span>
              {promptPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(pill)}
                  style={{
                    fontSize: '0.76rem',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all var(--trans-fast)'
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = 'rgba(56, 189, 248, 0.15)';
                    (e.target as HTMLElement).style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                    (e.target as HTMLElement).style.borderColor = 'var(--border-glass)';
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* 底部输入框 */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-glass)',
              background: 'rgba(11, 17, 32, 0.85)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="键入你想请教的问题，或点击右侧麦克风语音交流..."
                  className="input-luxury"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputText.trim()}
                  className="btn btn-primary"
                  style={{ padding: '11px 22px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <SendIcon size={14} />
                  <span>{isLoading ? '启发中...' : '发送'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 右侧数字人伴学展台 */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <TeacherDigitalHuman
              teacherName={synthRecipe?.name || teacher?.name || '王崇林 老师'}
              subtitle={teacher?.style || '启发式板书与图景推演'}
              avatarState={avatarState}
              modelVideoUrl={teacher?.dhModelVideoUrl || './demo_videos/model.mp4'}
              captionText={caption}
              voiceOn={voiceOn}
              onToggleVoice={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                if (!next) speechService.stop();
              }}
              onTranscript={text => handleSendMessage(text)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
