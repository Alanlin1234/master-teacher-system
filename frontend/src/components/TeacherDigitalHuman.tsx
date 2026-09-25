import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';
import {
  VolumeIcon,
  VolumeMuteIcon,
  MicIcon,
  MicOffIcon,
  VideoCameraIcon,
  MessageSquareIcon,
  UserIcon,
  RefreshIcon,
  CheckIcon,
} from './Icons';
import { useFloatingStage } from '../lib/gsap';

export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening';

interface Props {
  teacherName?: string;
  subject?: string;
  subtitle?: string;
  avatarState?: AvatarState;
  modelVideoUrl?: string;
  photoUrl?: string;
  posterUrl?: string;
  voiceOn?: boolean;
  onToggleVoice?: () => void;
  onTranscript?: (text: string) => void;
  captionText?: string;
  forceUnmute?: boolean;
  teachersList?: any[];
  onSelectTeacher?: (teacher: any) => void;
}

const NATIVE_TRANSCRIPTS = [
  { start: 0, end: 45, text: "历史究竟是由英雄和思想观念创造，还是由普通人的生产生活创造？《德意志意识形态》是唯物史观第一次被完整、系统地写出来的著作。这节课沿着原著原文，把核心原理拆开，再对照当代实践。" },
  { start: 45, end: 95, text: "这本书写于1845到1846年，是马克思和恩格斯合著的，标志着唯物史观正式形成。它要清算青年黑格尔派的谬误，划清唯物史观和唯心史观的界限，并为无产阶级革命提供科学理论。" },
  { start: 95, end: 150, text: "人们为了创造历史，首先要能够生活，所以先要吃喝住穿。不是意识决定存在，而是社会存在决定社会意识。手推磨产生的是封建主的社会，蒸汽磨产生的是工业资本家的社会。" },
  { start: 150, end: 220, text: "记住这条链：物质生产是起点，社会存在决定社会意识是根本原则，生产力与生产关系的矛盾是发展动力，人的自由全面发展是最终目标。青年要把个人成长放进这个真实的集体里。" }
];

const cleanMediaUrl = (url?: string) => {
  if (!url || url.includes('model.mp4') || url.includes('fallback-replaced.mp4')) {
    return './demo_videos/merged.mp4';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return '.' + url;
  return url;
};

export const TeacherDigitalHuman: React.FC<Props> = ({
  teacherName = '王崇林 (特级教师)',
  subject = '数学',
  subtitle = '全国数学竞赛金牌教练 · 启发式逻辑推演',
  avatarState = 'idle',
  modelVideoUrl = './demo_videos/merged.mp4',
  photoUrl = './avatars/t1.svg',
  posterUrl = './demo_videos/merged_poster.jpg',
  voiceOn = true,
  onToggleVoice,
  onTranscript,
  captionText = '',
  forceUnmute,
  teachersList,
  onSelectTeacher,
}) => {
  // 核心模式切换：真实数字人视频 ('video') VS 名师形象头像 ('avatar')
  const [viewMode, setViewMode] = useState<'video' | 'avatar'>('video');
  // 头像风格：矢量学术画像 ('portrait') VS 拟真定妆海报 ('poster')
  const [avatarType, setAvatarType] = useState<'portrait' | 'poster'>('portrait');
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [syncedSubtitle, setSyncedSubtitle] = useState('');
  const [viewFit, setViewFit] = useState<'cover' | 'contain'>('contain');

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = cleanMediaUrl(modelVideoUrl);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isAudioMuted;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  useEffect(() => {
    if (forceUnmute !== undefined) {
      setIsAudioMuted(!forceUnmute);
      if (videoRef.current) {
        videoRef.current.muted = !forceUnmute;
        videoRef.current.volume = 1.0;
        if (forceUnmute) {
          speechService.stop();
          videoRef.current.play().catch(() => {});
        }
      }
    }
  }, [forceUnmute]);

  const toggleVideoAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isAudioMuted;
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = 1.0;
      if (!nextMuted) {
        speechService.stop();
        videoRef.current.play().catch(err => console.warn('Video audio play error:', err));
      }
      setIsAudioMuted(nextMuted);
      onToggleVoice?.();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isAudioMuted) {
      const cur = videoRef.current.currentTime;
      const seg = NATIVE_TRANSCRIPTS.find(s => cur >= s.start && cur < s.end);
      if (seg) {
        setSyncedSubtitle(seg.text);
      }
    }
  };

  // Wire GSAP subtle floating motion
  useFloatingStage(stageRef, 5, 4.0);

  const handleToggleMic = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechService.startListening(
        text => {
          setIsListening(false);
          onTranscript?.(text);
        },
        () => setIsListening(false)
      );
    }
  };

  const stateColors: Record<AvatarState, string> = {
    idle: '#10b981',
    thinking: '#38bdf8',
    speaking: '#3b82f6',
    listening: '#ec4899',
  };

  const stateLabels: Record<AvatarState, string> = {
    idle: viewMode === 'video' ? 'LIVE 1080P' : '名师专属肖像',
    thinking: '深度推理中',
    speaking: '讲解进行中',
    listening: '语音倾听中',
  };

  // 动态解析头像 URL
  const currentAvatarSrc = cleanMediaUrl(
    avatarType === 'portrait' ? (photoUrl || posterUrl) : (posterUrl || photoUrl)
  );

  return (
    <div ref={stageRef} className="digital-human-frame" style={{ padding: '20px' }}>
      {/* 视觉呈现双模切换中枢：真实数字人视频 VS 名师形象头像 */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-surface-elevated)',
        padding: '3px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-glass)',
        marginBottom: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          type="button"
          onClick={() => setViewMode('video')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: viewMode === 'video' ? 'var(--accent-primary)' : 'transparent',
            color: viewMode === 'video' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all var(--trans-fast)',
            boxShadow: viewMode === 'video' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          <VideoCameraIcon size={14} />
          <span>真实数字人视频</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('avatar')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: viewMode === 'avatar' ? 'var(--accent-primary)' : 'transparent',
            color: viewMode === 'avatar' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all var(--trans-fast)',
            boxShadow: viewMode === 'avatar' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          <UserIcon size={14} />
          <span>名师形象头像</span>
        </button>
      </div>

      {/* 顶部极简硬件状态指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stateColors[avatarState],
            boxShadow: `0 0 10px ${stateColors[avatarState]}`,
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
            {stateLabels[avatarState]}
          </span>
          {avatarState === 'speaking' && (
            <div className="audio-equalizer" style={{ marginLeft: '4px' }}>
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {viewMode === 'video' ? (
            <>
              {/* 画幅切换按钮 (特写 vs 全景) */}
              <button
                type="button"
                onClick={() => setViewFit(f => f === 'cover' ? 'contain' : 'cover')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="点击切换：特写人像 / 完整全景"
              >
                {viewFit === 'cover' ? '全景模式' : '特写模式'}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}>
                <VideoCameraIcon size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>4K UltraHD</span>
              </div>
            </>
          ) : (
            <>
              {/* 头像海报切换按钮 */}
              <button
                type="button"
                onClick={() => setAvatarType(t => t === 'portrait' ? 'poster' : 'portrait')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="点击切换：矢量学术画像 / 拟真形象海报"
              >
                {avatarType === 'portrait' ? '切换为定妆海报' : '切换为学术画像'}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}>
                <UserIcon size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>2D 高清微晶</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 核心演播视窗 (精准黄金比例容器：同时支撑视频与头像无缝切换，绝无闪烁跳动) */}
      <div style={{
        height: '380px',
        maxWidth: '340px',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: '#040711',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* 数字人视频渲染层 */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterUrl}
          autoPlay
          loop
          muted={isAudioMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: '100%',
            height: '100%',
            objectFit: viewFit,
            objectPosition: viewFit === 'cover' ? 'center 12%' : 'center center',
            filter: avatarState === 'thinking' ? 'brightness(0.9) contrast(1.05)' : 'brightness(1.0)',
            transition: 'object-fit 0.3s ease',
            display: viewMode === 'video' ? 'block' : 'none',
          }}
        />

        {/* 名师专属头像肖像展示层 */}
        {viewMode === 'avatar' && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 36%, rgba(37, 99, 235, 0.16) 0%, rgba(8, 12, 22, 0.96) 100%)',
            padding: '24px',
            position: 'relative',
          }}>
            {/* 头像外层声纹光晕动效环 */}
            <div style={{
              position: 'relative',
              width: '190px',
              height: '190px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              {/* 说话/发声时的脉冲波纹 */}
              {avatarState === 'speaking' && (
                <>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid rgba(59, 130, 246, 0.65)',
                    animation: 'pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '124%',
                    height: '124%',
                    borderRadius: '50%',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    animation: 'pulse 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }} />
                </>
              )}

              {/* 拟真肖像容器 */}
              <div style={{
                width: '164px',
                height: '164px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#090d16',
                border: avatarState === 'speaking' ? '3px solid var(--accent-primary)' : '2px solid rgba(255, 255, 255, 0.18)',
                boxShadow: avatarState === 'speaking'
                  ? '0 0 28px rgba(59, 130, 246, 0.55)'
                  : '0 8px 24px rgba(0, 0, 0, 0.6)',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                <img
                  src={currentAvatarSrc}
                  alt={teacherName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: avatarType === 'portrait' ? 'contain' : 'cover',
                  }}
                />
              </div>
            </div>

            {/* 状态徽章胶囊 */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '0.74rem',
              color: '#ffffff',
              marginBottom: '10px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: avatarState === 'speaking' ? '#10b981' : 'var(--accent-primary)',
                display: 'inline-block'
              }} />
              <span>{avatarState === 'speaking' ? '名师语音点拨中…' : avatarState === 'thinking' ? '正在解构题意推演…' : '特级名师在线 · 随时提问'}</span>
            </div>

            {/* 说话时声浪频谱动效 */}
            {avatarState === 'speaking' && (
              <div className="audio-equalizer" style={{ marginTop: '2px' }}>
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            )}
          </div>
        )}

        {/* 浮动原声控制胶囊 (直观显眼，彻底解决'MP4没声音'疑问) */}
        {viewMode === 'video' && (
          <button
            type="button"
            onClick={toggleVideoAudio}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: isAudioMuted ? 'rgba(15, 23, 42, 0.88)' : '#10b981',
              backdropFilter: 'blur(8px)',
              border: isAudioMuted ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(52, 211, 153, 0.6)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title={isAudioMuted ? '点击开启 MP4 视频真人原声' : '点击静音'}
          >
            {isAudioMuted ? (
              <>
                <VolumeMuteIcon size={14} style={{ color: '#f87171' }} />
                <span>开启视频原声</span>
              </>
            ) : (
              <>
                <VolumeIcon size={14} style={{ color: '#ffffff' }} />
                <span>名师原声播放中</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 名师身份信息栏与切换按钮 */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{teacherName}</span>
            {subject && (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent-primary)',
              }}>
                {subject}特级名师
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        </div>

        {/* 快速换一位老师按钮 */}
        {teachersList && teachersList.length > 1 && (
          <button
            type="button"
            onClick={() => setShowTeacherPicker(!showTeacherPicker)}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              transition: 'all var(--trans-fast)'
            }}
            title="更换其他学科或风格的特级名师"
          >
            <RefreshIcon size={12} />
            <span>更换名师</span>
          </button>
        )}
      </div>

      {/* 展开的名师选择卡片 */}
      {showTeacherPicker && teachersList && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-md)',
          maxHeight: '220px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            切换当前 1对1 伴学名师：
          </div>
          {teachersList.map(t => {
            const isCurrent = t.name === teacherName;
            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTeacher?.(t);
                  setShowTeacherPicker(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent ? 'var(--card-bg)' : 'transparent',
                  border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  border: '1px solid var(--border-glass)',
                  flexShrink: 0
                }}>
                  {t.photoUrl ? (
                    <img src={cleanMediaUrl(t.photoUrl)} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{t.avatar || '👩‍🏫'}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isCurrent ? 'var(--accent-primary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.subject}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.style}
                  </div>
                </div>
                {isCurrent && <CheckIcon size={14} style={{ color: 'var(--accent-primary)' }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* 多模态交互控制中枢 */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* 语音播报开关 */}
        <button
          onClick={toggleVideoAudio}
          className="btn"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.82rem',
            background: !isAudioMuted ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: !isAudioMuted ? '#ffffff' : 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {!isAudioMuted ? <VolumeIcon size={15} /> : <VolumeMuteIcon size={15} />}
          <span>{!isAudioMuted ? '名师原声已开启' : '开启视频原声'}</span>
        </button>

        {/* 麦克风拾音按钮 */}
        <button
          onClick={handleToggleMic}
          className="btn"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.82rem',
            background: isListening ? '#f43f5e' : 'var(--bg-surface)',
            color: isListening ? '#ffffff' : 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isListening ? <MicOffIcon size={15} /> : <MicIcon size={15} />}
          <span>{isListening ? '松开发送' : '实时问答'}</span>
        </button>
      </div>

      {/* 实时滚动智能字幕卡 */}
      {(captionText || (!isAudioMuted && syncedSubtitle)) && (
        <div style={{
          marginTop: '14px',
          background: 'var(--bg-surface)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          color: 'var(--text-main)',
          borderLeft: '3px solid var(--accent-primary)',
          borderTop: '1px solid var(--border-glass)',
          borderRight: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
          lineHeight: '1.5',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <MessageSquareIcon size={14} style={{ color: 'var(--accent-primary)', marginTop: '2px', flexShrink: 0 }} />
          <span>{(captionText || syncedSubtitle).slice(0, 120)}...</span>
        </div>
      )}
    </div>
  );
};
