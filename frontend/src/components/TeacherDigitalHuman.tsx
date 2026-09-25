import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';
import {
  VolumeIcon,
  VolumeMuteIcon,
  MicIcon,
  MicOffIcon,
  VideoCameraIcon,
  MessageSquareIcon,
} from './Icons';
import { useFloatingStage } from '../lib/gsap';

export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening';

interface Props {
  teacherName?: string;
  subtitle?: string;
  avatarState?: AvatarState;
  modelVideoUrl?: string;
  voiceOn?: boolean;
  onToggleVoice?: () => void;
  onTranscript?: (text: string) => void;
  captionText?: string;
  forceUnmute?: boolean;
  posterUrl?: string;
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
  subtitle = '全国数学竞赛金牌教练 · 启发式逻辑推演',
  avatarState = 'idle',
  modelVideoUrl = './demo_videos/merged.mp4',
  voiceOn = true,
  onToggleVoice,
  onTranscript,
  captionText = '',
  forceUnmute,
  posterUrl = './demo_videos/merged_poster.jpg',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [syncedSubtitle, setSyncedSubtitle] = useState('');
  const [viewFit, setViewFit] = useState<'cover' | 'contain'>('contain');
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = cleanMediaUrl(modelVideoUrl);

  useEffect(() => {
    if (videoRef.current) {
      // 现代浏览器要求自动播放必须初始静音以防被策略拦截
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
          // 停止任何合成语音，确保纯正名师视频原声
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
        // 彻底停止可能在朗读的合成TTS，确保真人原声不受干扰
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
    idle: 'LIVE 1080P',
    thinking: '深度推理中',
    speaking: '讲解进行中',
    listening: '语音倾听中',
  };

  return (
    <div ref={stageRef} className="digital-human-frame" style={{ padding: '22px' }}>
      {/* 顶部极简硬件状态指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stateColors[avatarState],
            boxShadow: `0 0 10px ${stateColors[avatarState]}`,
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.06em' }}>
            {stateLabels[avatarState]}
          </span>
          {avatarState === 'speaking' && (
            <div className="audio-equalizer" style={{ marginLeft: '6px' }}>
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 画幅切换按钮 (特写 vs 全景) */}
          <button
            type="button"
            onClick={() => setViewFit(f => f === 'cover' ? 'contain' : 'cover')}
            style={{
              padding: '3px 9px',
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
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            <VideoCameraIcon size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>4K UltraHD</span>
          </div>
        </div>
      </div>

      {/* 核心演播视窗 (精准黄金人像取景，完整呈现眼睛、面容与神态) */}
      <div style={{
        height: '380px',
        maxWidth: '340px',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: '#020617',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-glass)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
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
            transition: 'object-fit 0.3s ease'
          }}
        />

        {/* 浮动原声控制胶囊 (直观显眼，彻底解决'MP4没声音'疑问) */}
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
      </div>

      {/* 名师身份信息栏 */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {teacherName}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subtitle}
        </div>
      </div>

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
