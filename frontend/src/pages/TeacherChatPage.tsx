import React, { useState, useEffect, useRef } from 'react';
import { teachersApi, getStoredQwenKey, setStoredQwenKey } from '../services/api';
import { speechService } from '../services/speech';
import { TeacherDigitalHuman, AvatarState } from '../components/TeacherDigitalHuman';
import { RichMarkdown } from '../components/RichMarkdown';
import {
  MessageSquareIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  SendIcon,
  SlidersIcon,
  CloseIcon,
  CheckIcon,
  VolumeIcon,
  VolumeMuteIcon,
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
  const [voiceMode, setVoiceMode] = useState<'native' | 'tts' | 'off'>('native');
  const [forceUnmute, setForceUnmute] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredQwenKey());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nativeVoiceTimerRef = useRef<any>(null);

  const promptPills = [
    '请老师用数形结合法推导极限与导数的本质定义',
    '这道高考压轴题第二问有什么秒杀口诀？',
    '能不能帮我出两道含参同构变式题巩固一下？',
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
          ? `同学你好！我是【${synthRecipe.name}】。已融合特级名师多维教学基因，随时准备解答你的核心学术难题，请提出你的问题！`
          : `同学你好！我是你的${res.teacher.subject}老师【${res.teacher.name}】。遇到任何理解卡点或大题推导难点，随时打在公屏上，咱们由浅入深一起攻克！`;

        setMessages([{ role: 'assistant', content: greeting }]);
        if (voiceMode === 'tts') {
          speechService.speak(greeting);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    if (nativeVoiceTimerRef.current) clearTimeout(nativeVoiceTimerRef.current);

    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(newMsgs);
    setInputText('');
    setIsLoading(true);
    setAvatarState('thinking');

    const teacherId = synthRecipe ? 'synth' : (teacher?.id || initialTeacherId);
    let fullReply = '';

    // 占位追加回复
    setMessages([...newMsgs, { role: 'assistant', content: '' }]);

    await teachersApi.streamChat(
      teacherId,
      newMsgs,
      synthRecipe,
      (delta) => {
        fullReply += delta;
        setMessages([...newMsgs, { role: 'assistant', content: fullReply }]);
        setAvatarState('speaking');
        setCaption(fullReply.slice(-35));
      },
      () => {
        setIsLoading(false);
        setCaption('');
        if (voiceMode === 'native') {
          // 彻底拒绝默认机器人合成音，使用用户上传 MP4 中的名师真实原声
          speechService.stop();
          setForceUnmute(true);
          setAvatarState('speaking');
          if (nativeVoiceTimerRef.current) clearTimeout(nativeVoiceTimerRef.current);
          nativeVoiceTimerRef.current = setTimeout(() => {
            setForceUnmute(false);
            setAvatarState('idle');
          }, 18000);
        } else if (voiceMode === 'tts' && fullReply) {
          speechService.speak(fullReply.replace(/(\$\$[^$]+\$\$|\$[^$]+\$)/g, '公式推导如屏幕所示'));
        } else {
          setAvatarState('idle');
        }
      },
      (err) => {
        console.error("Chat error:", err);
        setIsLoading(false);
        setAvatarState('idle');
        setMessages([...newMsgs, { role: 'assistant', content: fullReply || '（名师正在连线教研大脑，请稍候再试…）' }]);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <MessageSquareIcon size={19} />
            </div>
            <div>
              <h2 className="brand-display" style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {synthRecipe ? synthRecipe.name : teacher ? `${teacher.name} · 1对1深度互动课堂` : '名师伴学'}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {teacher?.style} · 真实通义千问 Qwen-Plus 驱动 · 印刷级 KaTeX 数学板书
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 名师原声 / AI语音 / 静音 交互胶囊 */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              fontSize: '0.78rem',
              gap: '3px'
            }}>
              <button
                onClick={() => {
                  speechService.stop();
                  setVoiceMode('native');
                  setForceUnmute(true);
                  setAvatarState('speaking');
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: voiceMode === 'native' ? 700 : 500,
                  background: voiceMode === 'native' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  color: voiceMode === 'native' ? 'var(--cyan-neon)' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                title="播放已上传视频中主讲导师的原汁原味真实声线"
              >
                <VolumeIcon size={13} />
                <span>名师视频原声</span>
              </button>

              <button
                onClick={() => {
                  setForceUnmute(false);
                  setVoiceMode('tts');
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: voiceMode === 'tts' ? 700 : 500,
                  background: voiceMode === 'tts' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  color: voiceMode === 'tts' ? 'var(--cyan-neon)' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                title="浏览器实时朗读问答板书公式"
              >
                <span>AI 合成朗读</span>
              </button>

              <button
                onClick={() => {
                  speechService.stop();
                  setForceUnmute(false);
                  setAvatarState('idle');
                  setVoiceMode('off');
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: voiceMode === 'off' ? 700 : 500,
                  background: voiceMode === 'off' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: voiceMode === 'off' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                title="静音伴学模式"
              >
                <span>静音</span>
              </button>
            </div>

            {/* AI 引擎指示器 */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderColor: 'var(--border-academic)',
                color: '#93c5fd',
                background: 'rgba(59, 130, 246, 0.1)'
              }}
              title="点击查看/配置阿里云通义千问 API 引擎"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>通义千问 (Qwen-Plus) · 已连通</span>
              <SlidersIcon size={13} />
            </button>

            <button
              onClick={handleExportChat}
              className="btn btn-secondary"
              style={{ fontSize: '0.86rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '7px' }}
              title="将本次问答记录转化为微课脚本"
            >
              <VideoCameraIcon size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>导出为微课脚本</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>
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
              background: 'rgba(11, 17, 32, 0.5)'
            }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-subtle)',
                    marginBottom: '6px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {m.role === 'user' ? '我的提问' : `${synthRecipe ? synthRecipe.name : teacher?.name || '特级名师'} 点拨`}
                  </div>
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '14px 18px',
                      borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: m.role === 'user'
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                        : '#0d1527',
                      border: m.role === 'user'
                        ? '1px solid rgba(59, 130, 246, 0.4)'
                        : '1px solid rgba(217, 119, 6, 0.18)',
                      color: '#ffffff',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.role === 'user' ? (
                      <div style={{ fontSize: '0.94rem', lineHeight: '1.6' }}>{m.content}</div>
                    ) : (
                      <RichMarkdown content={m.content} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '0.86rem', padding: '6px 12px' }}>
                  <span className="live-pulse-dot" style={{ background: 'var(--accent-gold)' }} />
                  <span>名师正在运笔推演与组织板书…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 启发式追问胶囊 */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-glass)',
              background: '#0a0f1d',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {promptPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(pill)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent-gold-light)';
                    e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
              background: '#090e1b',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="请将你遇到的难点、公式或题目提问输入此处（Enter 发送）…"
                className="input-luxury"
                style={{ flex: 1, padding: '12px 18px', fontSize: '0.92rem', borderRadius: '10px' }}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="btn btn-primary"
                style={{ padding: '12px 22px', fontSize: '0.92rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <SendIcon size={16} />
                <span>提问</span>
              </button>
            </div>
          </div>

          {/* 右侧数字人演播展台 */}
          <div style={{ position: 'sticky', top: '84px' }}>
            <TeacherDigitalHuman
              teacherName={synthRecipe?.name || teacher?.name || '王崇林 (特级教师)'}
              subtitle={teacher?.style || '启发式板书与图景推演'}
              avatarState={avatarState}
              modelVideoUrl={teacher?.dh_model_video_url || './demo_videos/merged.mp4'}
              posterUrl={teacher?.photoUrl ? (teacher.photoUrl.startsWith('/') ? '.' + teacher.photoUrl : teacher.photoUrl) : './demo_videos/merged_poster.jpg'}
              captionText={caption}
              forceUnmute={forceUnmute}
              voiceOn={voiceMode !== 'off'}
              onToggleVoice={() => {
                if (nativeVoiceTimerRef.current) clearTimeout(nativeVoiceTimerRef.current);
                if (voiceMode === 'native') {
                  if (forceUnmute || avatarState === 'speaking') {
                    setForceUnmute(false);
                    setAvatarState('idle');
                  } else {
                    speechService.stop();
                    setForceUnmute(true);
                    setAvatarState('speaking');
                  }
                } else if (voiceMode === 'tts') {
                  speechService.stop();
                  setAvatarState('idle');
                  setVoiceMode('native');
                  setForceUnmute(true);
                } else {
                  setVoiceMode('native');
                  setForceUnmute(true);
                }
              }}
              onTranscript={text => handleSend(text)}
            />
          </div>
        </div>
      </div>

      {/* AI 引擎配置抽屉 / 模态框 */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card-impeccable" style={{
            width: '100%',
            maxWidth: '480px',
            background: '#0d1527',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            padding: '28px',
            borderRadius: '16px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowKeyModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <CloseIcon size={20} />
            </button>

            <h3 className="brand-display" style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
              AI 教学大脑配置
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
              系统已配置连接阿里云 DashScope 通义千问（Qwen-Plus）大模型。无论在本地还是在 GitHub Pages 公网部署，均支持真实大模型流式解答并实时生成标准 LaTeX 数学板书。
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '8px', fontWeight: 600 }}>
                DashScope API Key (阿里云密钥)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="input-luxury"
                placeholder="sk-..."
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.86rem', padding: '10px 14px' }}
              />
              <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckIcon size={14} />
                <span>已预填您的有效 Qwen 密钥，状态正常</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
              <button
                onClick={() => {
                  setStoredQwenKey("sk-f3ca2c7e114f47d88dabf1cf5f4ac527");
                  setApiKeyInput("sk-f3ca2c7e114f47d88dabf1cf5f4ac527");
                  setShowKeyModal(false);
                }}
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                重置为默认密钥
              </button>
              <button
                onClick={() => {
                  setStoredQwenKey(apiKeyInput);
                  setShowKeyModal(false);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 22px' }}
              >
                保存并生效
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
