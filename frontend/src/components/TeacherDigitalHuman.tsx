import React, { useState, useRef } from 'react';
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
}

export const TeacherDigitalHuman: React.FC<Props> = ({
  teacherName = '王崇林 (特级教师)',
  subtitle = '全国数学竞赛金牌教练 · 启发式逻辑推演',
  avatarState = 'idle',
  modelVideoUrl = '/demo_videos/model.mp4',
  voiceOn = true,
  onToggleVoice,
  onTranscript,
  captionText = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

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
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.06em' }}>
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

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <VideoCameraIcon size={13} style={{ color: 'var(--cyan-neon)' }} />
          <span>4K UltraHD</span>
        </div>
      </div>

      {/* 核心演播视窗 (纯净镜面，无标签药丸遮挡) */}
      <div style={{
        height: '310px',
        borderRadius: 'var(--radius-lg)',
        background: '#020617',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
        <video
          src={modelVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: avatarState === 'thinking' ? 'brightness(0.9) contrast(1.05)' : 'brightness(1.0)'
          }}
        />

        {/* 顶部微暗角遮罩 (巧妙遮掩原视频外设角标) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(6, 9, 17, 0.6) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* 名师身份信息栏 */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          {teacherName}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subtitle}
        </div>
      </div>

      {/* 多模态交互控制中枢 (全矢量图标，零 Emoji) */}
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
          onClick={onToggleVoice}
          className="btn"
          style={{
            flex: 1,
            padding: '7px 12px',
            fontSize: '0.82rem',
            background: voiceOn ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.04)',
            color: voiceOn ? 'var(--cyan-neon)' : 'var(--text-muted)',
            border: voiceOn ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {voiceOn ? <VolumeIcon size={15} /> : <VolumeMuteIcon size={15} />}
          <span>{voiceOn ? '语音解说' : '静音模式'}</span>
        </button>

        {/* 麦克风拾音按钮 */}
        <button
          onClick={handleToggleMic}
          className="btn"
          style={{
            flex: 1,
            padding: '7px 12px',
            fontSize: '0.82rem',
            background: isListening ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.04)',
            color: isListening ? '#fb7185' : 'var(--text-body)',
            border: isListening ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-glass)',
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

      {/* 实时滚动智能字幕卡 (精致无杂音) */}
      {captionText && (
        <div style={{
          marginTop: '14px',
          background: 'rgba(11, 17, 32, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          color: '#e2e8f0',
          borderLeft: '3px solid var(--cyan-neon)',
          borderTop: '1px solid var(--border-glass)',
          borderRight: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
          lineHeight: '1.5',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <MessageSquareIcon size={14} style={{ color: 'var(--cyan-neon)', marginTop: '2px' }} />
          <span>{captionText.slice(0, 120)}...</span>
        </div>
      )}
    </div>
  );
};
