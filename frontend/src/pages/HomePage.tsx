import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import {
  Sparkles,
  Zap,
  GraduationCap,
  Bot,
  Lightbulb,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Activity,
  Sliders,
  AlertCircle,
  BarChart2,
  Tv,
  Search,
  BookOpen,
  CheckCircle2,
  Award,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Play,
  Users,
  Network,
} from 'lucide-react';
import { RadarChart5D } from '../components/RadarChart5D';
import { prefersReducedMotion, useHeroEntrance, useCountUp, useCountUpFloat } from '../lib/gsap';
import { speechService } from '../services/speech';
import { monitorApi } from '../services/eduApi';
import { getLearnerName, readDiagnosis, type StoredDiagnosis } from '../services/learnerStore';

interface Props {
  onNavigate: (tab: string, params?: { weakKnowledge?: string[]; collectSegment?: 'monitor' | 'perception' | 'analysis'; teacherSection?: string; initialScores?: Record<string, number> }) => void;
}

const AXES = [
  { key: 'style', label: '教学风格', low: '先问启发', high: '严密实证' },
  { key: 'method', label: '推导方法', low: '顺藤摸瓜', high: '直击易错' },
  { key: 'strengths', label: '核心特长', low: '模型精简', high: '数形结合' },
  { key: 'personality', label: '互动温度', low: '平等亲近', high: '严谨沉稳' },
  { key: 'communication', label: '表达节奏', low: '循序渐进', high: '宏观先导' },
] as const;

type AxisKey = (typeof AXES)[number]['key'];

interface Preset {
  id: string;
  name: string;
  prompt: string;
  scores: Record<AxisKey, number>;
}

const PRESETS: Preset[] = [
  {
    id: 'socratic',
    name: '苏格拉底启发型',
    prompt: 'K12 思维进阶 · 抽象函数与极值构造 · 编译苏格拉底递进反问名师...',
    scores: { style: 0.25, method: 0.35, strengths: 0.92, personality: 0.88, communication: 0.3 },
  },
  {
    id: 'olympiad',
    name: '竞赛公理破局型',
    prompt: '数学素养 · 几何统一与公理化证明 · 编译极简破局特级名师...',
    scores: { style: 0.95, method: 0.92, strengths: 0.88, personality: 0.55, communication: 0.9 },
  },
  {
    id: 'deepthink',
    name: '思维进阶突破型',
    prompt: '难点攻坚 · 知识迁移与数形转化 · 编译多维启发名师...',
    scores: { style: 0.75, method: 0.88, strengths: 0.45, personality: 0.72, communication: 0.82 },
  },
];

const SAMPLE_QUESTIONS = [
  '极值点偏移为什么一定要构造对称差函数？',
  '椭圆与双曲线的离心率在几何统一性上怎么直观理解？',
  '为什么导数大于0函数一定单调递增，逆命题为何不成立？',
];

/**
 * 印刷级 KaTeX 数学公式渲染
 */
function renderKatexHtml(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return `<span class="katex-fallback">${latex}</span>`;
  }
}

interface FeaturedMaster {
  id: string;
  name: string;
  title: string;
  subject: string;
  photoUrl: string;
  quote: string;
  tag: string;
  badge: string;
  experience: string;
}

const FEATURED_MASTERS: FeaturedMaster[] = [
  {
    id: 't1',
    name: '王崇林',
    title: '特级教师 · 金牌教练',
    subject: '高中数学',
    photoUrl: './avatars/t1.svg',
    quote: '构造对称差函数，化复杂的二元极值约束直接降维至一元单调性判定。',
    tag: '思维启发 · 竞赛公理',
    badge: '全国特级教师',
    experience: '32年教龄 · 培养14名CMO金牌'
  },
  {
    id: 't2',
    name: '李清韵',
    title: '特级教师 · 高考阅卷组长',
    subject: '高中语文',
    photoUrl: './avatars/t2.svg',
    quote: '由文入道，品读意象深处的家国情怀，以哲学思辨重塑高考文思。',
    tag: '情境文学 · 审美哲思',
    badge: '国家级教学名师',
    experience: '28年教龄 · 权威作文评卷人'
  },
  {
    id: 't3',
    name: '张文斌',
    title: '正高级教师 · 奥赛导师',
    subject: '高中物理',
    photoUrl: './avatars/t3.svg',
    quote: '抓住能量守恒与电磁感应双棒动量定理，拨开繁杂计算直击物理本源。',
    tag: '模型归纳 · 严谨推演',
    badge: '全国正高级教师',
    experience: '29年教龄 · CPhO指导教练'
  },
  {
    id: 't4',
    name: '赵雅婷',
    title: '特级教师 · 跨文化思辨',
    subject: '学科英语',
    photoUrl: './avatars/t4.svg',
    quote: '拆解长难句语法骨架，在语篇建构中领会纯正原版逻辑与思辨精髓。',
    tag: '原版思辨 · 语篇建构',
    badge: '国际TESOL专家',
    experience: '22年教龄 · 语法与读写带头人'
  },
  {
    id: 't5',
    name: '周怀瑾',
    title: '特级教师 · 实验名师',
    subject: '高中化学',
    photoUrl: './avatars/t5.svg',
    quote: '从微观粒子运动直击宏观化学平衡转化率，平衡移动一式了然。',
    tag: '宏微结合 · 探究实验',
    badge: '化学学科带头人',
    experience: '26年教龄 · 命题研究专家'
  },
  {
    id: 't6',
    name: '刘思齐',
    title: '骨干名师 · 历史领军',
    subject: '高中历史',
    photoUrl: './avatars/t6.svg',
    quote: '唯物史观穿透时空，探寻生产力与社会发展的内在逻辑与时代回响。',
    tag: '唯物史观 · 时空观念',
    badge: '特级历史名师',
    experience: '25年教龄 · 史学研究学者'
  },
  {
    id: 't7',
    name: '韩雪松',
    title: '特级教师 · 综合大题',
    subject: '高中生物',
    photoUrl: './avatars/t7.svg',
    quote: '生命系统结构与功能观，破解遗传概率与现代生物工程压轴大题。',
    tag: '生命观念 · 科学探究',
    badge: '竞赛金牌导师',
    experience: '24年教龄 · 生物大题破局专家'
  },
  {
    id: 't8',
    name: '高志伟',
    title: '金牌教练 · 幽默秒杀',
    subject: '高中数学',
    photoUrl: './avatars/t8.svg',
    quote: '秒杀不是投机，而是建立在极致公理直觉之上的高维降维打击。',
    tag: '激情幽默 · 极简破局',
    badge: '数学思维拓荒者',
    experience: '20年教龄 · 秒杀解题法创始人'
  },
];

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('socratic');
  const [scores, setScores] = useState<Record<AxisKey, number>>(PRESETS[0].scores);
  const [promptText, setPromptText] = useState<string>(PRESETS[0].prompt);
  const [userQuestion, setUserQuestion] = useState<string>(SAMPLE_QUESTIONS[0]);
  const [customInputText, setCustomInputText] = useState<string>('');
  const [waveOffset, setWaveOffset] = useState<number>(0);
  const [eqLevels, setEqLevels] = useState<number[]>([18, 34, 22, 42, 28, 48, 32, 20]);
  const [irtTheta, setIrtTheta] = useState<number>(1.42);
  const [focusMinutes, setFocusMinutes] = useState<number>(82);
  const [diagnosis, setDiagnosis] = useState<StoredDiagnosis | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState<boolean>(false);

  const [playingMasterId, setPlayingMasterId] = useState<string | null>(null);

  const safeMasterRetention = useMemo(() => {
    const avg = (scores.style + scores.method + scores.strengths + scores.personality + scores.communication) / 5;
    return Math.min(98, Math.max(82, Math.round(76 + avg * 22)));
  }, [scores]);

  const toggleHeroAudio = () => {
    if (isHeroAudioPlaying) {
      speechService.stop();
      setIsHeroAudioPlaying(false);
    } else {
      speechService.stop();
      setPlayingMasterId(null);
      setIsHeroAudioPlaying(true);
      speechService.speak(
        "同学你好！我是你的数学特级名师王崇林。任何复杂极值与导数综合难题，我带你由浅入深，从草稿纸第一步开始剖析，咱们一起攻克！",
        () => setIsHeroAudioPlaying(true),
        () => setIsHeroAudioPlaying(false)
      );
    }
  };

  const toggleMasterAudio = (master: FeaturedMaster) => {
    if (playingMasterId === master.id) {
      speechService.stop();
      setPlayingMasterId(null);
    } else {
      speechService.stop();
      setIsHeroAudioPlaying(false);
      setPlayingMasterId(master.id);
      speechService.speak(
        `同学你好！我是${master.subject}名师${master.name}。${master.quote}`,
        () => setPlayingMasterId(master.id),
        () => setPlayingMasterId(null)
      );
    }
  };

  const animatedPrecision = useCountUpFloat(0.1, 1.2, true, 1);
  const animatedConvergence = useCountUpFloat(1.2, 1.4, true, 1);
  const animatedRetention = useCountUp(88, 1.6, true);

  const handleCopyFormula = (latex: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(latex).catch(() => {});
    }
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  useHeroEntrance(heroRef);

  useEffect(() => {
    const stored = readDiagnosis();
    setDiagnosis(stored);
    monitorApi.getDashboard(101, 101).then((dash) => {
      const seconds = dash.stats?.focus_seconds_today;
      if (typeof seconds === 'number') {
        setFocusMinutes(Math.round(seconds / 60));
      }
    }).catch(() => {
      setFocusMinutes(82);
    });
  }, []);

  // Waveform and EQ Animation (Calm, Serene, High-End Apple Breathing Flow)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.008; // 6x slower: calm, meditative, luxury breathing rhythm
      setWaveOffset(t);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const eqTimer = setInterval(() => {
      setEqLevels([
        14 + Math.random() * 16,
        22 + Math.random() * 18,
        18 + Math.random() * 20,
        26 + Math.random() * 16,
        20 + Math.random() * 22,
        24 + Math.random() * 16,
        16 + Math.random() * 14,
        12 + Math.random() * 12,
      ]);
    }, 1200);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(eqTimer);
    };
  }, []);

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setScores(preset.scores);
    setPromptText(preset.prompt);
  };

  const handleSliderChange = (key: AxisKey, val: number) => {
    setSelectedPreset('custom');
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleQuestionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customInputText.trim()) {
      setUserQuestion(customInputText.trim());
    }
  };

  const learnerName = getLearnerName() || '林同学 (K12 思维进阶)';
  const weakPoint = diagnosis?.weakKnowledge?.[0] || '极值点偏移与对数均值不等式';

  // Decluttered High-Impact Cognitive Diff
  const dynamicDiffAnswer = useMemo(() => {
    const isSocratic = scores.style < 0.5;

    if (userQuestion.includes('极值点偏移') || userQuestion.includes('差函数') || userQuestion.includes('极值')) {
      return {
        strategy: isSocratic ? '苏格拉底启发阶梯' : '竞赛公理深度推导',
        masterFormula: "F(x) = f(x) - f(2x_0 - x) \\implies F'(x) = f'(x) + f'(2x_0 - x)",
        masterQuote: '“构造对称差函数，将复杂的二元极值约束直接降维至一元单调性判定。”',
        baselineFormula: 'x_1 + x_2 = 2x_0 + \\Delta x \\quad [代入教案公式硬算]',
        baselineCritique: '“机械套用现成公式，没有认知台阶，变式考题依然无法举一反三。”',
        masterMetric: '认知留存率 +88%',
        baselineMetric: '遗忘率 74%',
        steps: [
          '识别对称中心 x₀',
          '反问测试点对称差',
          '判定一阶导数单峰性质',
        ],
      };
    }

    if (userQuestion.includes('离心率') || userQuestion.includes('圆锥曲线') || userQuestion.includes('椭圆')) {
      return {
        strategy: '动态几何统一投影',
        masterFormula: "\\frac{|PF|}{d(P, L)} = e \\quad \\Longleftrightarrow \\quad r(\\theta) = \\frac{ep}{1 - e \\cos\\theta}",
        masterQuote: '“抓住圆锥截面倾角的几何直观，一式统领椭圆、双曲线与抛物线。”',
        baselineFormula: "e = \\frac{c}{a} = \\sqrt{1 - \\frac{b^2}{a^2}} \\quad [死记公式]",
        baselineCritique: '“只背公式字母，缺乏空间投影直觉，遇到倾斜截面题目极易卡壳。”',
        masterMetric: '几何直觉 +92%',
        baselineMetric: '题型迁移率 28%',
        steps: [
          '圆锥截面母线投影',
          '准线与焦半径比值定义',
          '统一极坐标方程降维',
        ],
      };
    }

    return {
      strategy: '拉格朗日中值与单调单射',
      masterFormula: "f(x_2) - f(x_1) = f'(\\xi)(x_2 - x_1) > 0 \\quad (x_1 < \\xi < x_2)",
      masterQuote: '“正命题由中值定理严密实证；逆命题想一想 y = x³ 在原点处的切线斜率！”',
      baselineFormula: "f'(x) > 0 \\iff f(x) \\uparrow \\quad [忽略零点边界条件]",
      baselineCritique: '“倒果为因，漏掉‘在任意区间不恒为0’的边界检验，考试丢分率极高。”',
      masterMetric: '避坑率 100%',
      baselineMetric: '边界漏判率 68%',
      steps: [
        '中值定理严密求证',
        '反例反思 y=x³ 原点切线',
        '边界导数不恒为零检验',
      ],
    };
  }, [scores, userQuestion]);

  return (
    <div className="page-shell" style={{ overflowX: 'hidden', padding: 0 }}>

      {/* =================================================================
          ACT I: THE PROLOGUE & THE COGNITIVE FOLIO (序章 · 沉浸式对开书卷展台)
          ================================================================= */}
      <section ref={heroRef} className="apple-fullbleed-band apple-fullbleed-band--hero">
        <div className="apple-stage-container">
          
          {/* Book Chapter Ribbon */}
          <div style={{ textAlign: 'center' }}>
            <div className="apple-chapter-ribbon">
              <span className="apple-status-dot apple-status-dot--primary" />
              <span>PROLOGUE · 卷首语 · 认知编译范式转移</span>
            </div>
          </div>

          {/* Monumental Headline */}
          <h1 className="apple-monumental-headline" style={{ textWrap: 'balance' }}>
            今天先透彻诊断他卡在哪<br />
            <span>再决定由哪位名师来讲</span>
          </h1>

          {/* Precision Subtitle */}
          <p className="apple-pro-subtitle" style={{ maxWidth: 740, margin: '0 auto 36px', textWrap: 'balance' }}>
            一本专为 K12 全学段学生与特级名师编写的实时认知解构手册。基于毫米级多模态专注流与 IRT 认知穿透，即席重构特级名师专属解题基因。
          </p>

          {/* Apple Dual CTA Cluster */}
          <div className="apple-cta-cluster">
            <button
              type="button"
              className="apple-btn-pill-primary"
              onClick={() => onNavigate('collect', { collectSegment: 'monitor' })}
            >
              <span>启动全息学情采集</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="apple-btn-link"
              onClick={() => {
                const el = document.getElementById('workbench-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>翻开 5D 认知对决工作台</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Centered Apple Studio Display Bezel: The Cognitive Folio (对开书卷核心硬件展台) */}
          <div className="apple-studio-bezel apple-studio-bezel--centered">
            <div className="apple-studio-bezel-inner">
              
              {/* Window Controls Topbar */}
              <div className="apple-studio-topbar">
                <div className="apple-studio-dots">
                  <span className="apple-studio-dot apple-studio-dot--red" />
                  <span className="apple-studio-dot apple-studio-dot--yellow" />
                  <span className="apple-studio-dot apple-studio-dot--green" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                  <BookOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>THE COGNITIVE FOLIO · K12 核心考点现场解构 · 林同学 (学情实测)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span className="apple-status-dot apple-status-dot--primary" />
                  <span>LIVE 实时同频 · 12ms</span>
                </div>
              </div>

              {/* Folio Spread Canvas (对开双页思想交锋) */}
              <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
                
                {/* Left Page (Page 01 · 困惑草稿) */}
                <div className="apple-interactive-lift" style={{ flex: '1 1 340px', padding: '24px 28px', borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      PAGE 01 · 学生真实演算草稿断层 (STUDENT DRAFT)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      视线捕获热点
                    </span>
                  </div>

                  <div className="apple-draft-paper" style={{ padding: '20px 22px', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.8 }}>
                      <div>f'(x) = 2x - a/x = (2x² - a)/x</div>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>令 f'(x) = 0 =&gt; x₀ = √(a/2)</div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 'bold', background: 'rgba(0,113,227,0.06)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        第3步: 对称差放缩阻滞... (思维停顿 18.4s)
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-glass)' }}>
                      <span className="apple-status-dot apple-status-dot--primary" />
                      <span>视线锁定：在极值点偏移放缩临界点停留 18.4 秒</span>
                    </div>
                  </div>
                </div>

                {/* Cognitive Folio Spine (双页装订线与因果连接) */}
                <div className="apple-folio-spine">
                  <div className="apple-folio-spine-pill">
                    <span>COGNITIVE BRIDGE</span>
                  </div>
                </div>

                {/* Right Page (Page 02 · 名师点睛) */}
                <div className="apple-interactive-lift" style={{ flex: '1 1 360px', padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: '11px', fontWeight: 750, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
                        PAGE 02 · 特级名师启发式思维阶梯 (MASTER INSIGHT)
                      </span>
                      {/* Inline Master Voice Audio Pill */}
                      <button
                        type="button"
                        className={`folio-voice-pill ${isHeroAudioPlaying ? 'playing' : ''}`}
                        onClick={toggleHeroAudio}
                        title={isHeroAudioPlaying ? "静音特级名师原声" : "聆听特级名师原声解惑"}
                      >
                        {isHeroAudioPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{isHeroAudioPlaying ? '名师原声启发中...' : '聆听名师原声'}</span>
                        {isHeroAudioPlaying && (
                          <span className="folio-eq-bars">
                            <span className="folio-eq-bar" />
                            <span className="folio-eq-bar" />
                            <span className="folio-eq-bar" />
                            <span className="folio-eq-bar" />
                          </span>
                        )}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '12px' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>01</span>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>构造对称差函数：</span>
                          <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontWeight: 700, marginLeft: 6 }}>F(x) = f(x) - f(2x₀ - x)</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '12px' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>02</span>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>一阶求导单调判定：</span>
                          <span style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontWeight: 700, marginLeft: 6 }}>F'(x) = f'(x) + f'(2x₀ - x)</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '12px' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>03</span>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>单峰性质降维破局：</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600, marginLeft: 6 }}>化二元极值为一元单调性</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Math Chalkboard SVG */}
                  <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Ruler size={12} style={{ color: 'var(--accent-primary)' }} />
                        <span>LIVE MATH CHALKBOARD</span>
                      </span>
                      <div className="acoustic-eq-bar-wrap">
                        {eqLevels.map((lvl, idx) => (
                          <div key={idx} className="acoustic-eq-bar" style={{ height: `${lvl * 0.55}px`, background: 'var(--accent-primary)' }} />
                        ))}
                      </div>
                    </div>

                    <svg viewBox="0 0 360 85" style={{ width: '100%', height: 85 }}>
                      <line x1="20" y1="75" x2="340" y2="75" stroke="var(--border-glass)" strokeWidth="1" />
                      <line x1="50" y1="10" x2="50" y2="80" stroke="var(--border-glass)" strokeWidth="1" />
                      <path
                        d={`M 50 68 Q 150 15 280 ${48 + Math.sin(waveOffset) * 4}`}
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="2.5"
                      />
                      <path
                        d={`M 280 68 Q 190 15 50 ${48 + Math.cos(waveOffset) * 4}`}
                        fill="none"
                        stroke="rgba(0, 113, 227, 0.35)"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />
                      <circle cx="165" cy="35" r="3.5" fill="var(--accent-primary)" />
                      <line x1="165" y1="35" x2="165" y2="75" stroke="var(--accent-primary)" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="165" y="83" textAnchor="middle" fill="var(--accent-primary)" fontSize="9" fontFamily="monospace" fontWeight="bold">x₀</text>
                      <text x="250" y="38" fill="var(--accent-primary)" fontSize="10" fontFamily="monospace" fontWeight="bold">y = f(x)</text>
                      <text x="75" y="38" fill="var(--text-muted)" fontSize="9" fontFamily="monospace" fontWeight="bold">y = f(2x₀ - x)</text>
                    </svg>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =================================================================
          ACT I.5: THE GRAND MASTER GALLERY (全国特级正高级名师殿堂)
          ================================================================= */}
      <section id="grand-master-gallery" className="master-gallery-section apple-fullbleed-band--dark">
        <div className="apple-stage-container">
          <div className="apple-chapter-ribbon" style={{ marginBottom: 12 }}>
            <Users size={13} />
            <span>HALL OF MASTERS · 全国特级正高级名师殿堂</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            <div>
              <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', textAlign: 'left', margin: 0 }}>
                汇聚全国九大学科领军名师<br />
                <span>每一位名师，皆具 25 年以上执教智慧资产</span>
              </h2>
              <p className="apple-pro-subtitle" style={{ textAlign: 'left', marginTop: 10, marginBottom: 0, maxWidth: 640 }}>
                融合特级教师的解题心法、提问艺术与板书风骨。挑选专属领航导师，开启点石成金的思维觉醒之旅。
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="reel-nav-btn"
                onClick={() => {
                  const el = document.getElementById('master-cards-track');
                  el?.scrollBy({ left: -340, behavior: 'smooth' });
                }}
                title="向左滚动名师"
                aria-label="向左滚动名师"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="reel-nav-btn"
                onClick={() => {
                  const el = document.getElementById('master-cards-track');
                  el?.scrollBy({ left: 340, behavior: 'smooth' });
                }}
                title="向右滚动名师"
                aria-label="向右滚动名师"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Master Cards Horizontal Reel */}
          <div id="master-cards-track" className="master-gallery-scroll-container">
            {FEATURED_MASTERS.map((master) => {
              const isPlaying = playingMasterId === master.id;
              return (
                <div key={master.id} className="master-gallery-card">
                  <div className="master-gallery-photo-wrap">
                    <img
                      src={master.photoUrl}
                      alt={master.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './avatars/t1.svg';
                      }}
                    />
                    <div className="master-gallery-photo-gradient" />
                    <div className="master-subject-badge-clean">
                      <Award size={12} />
                      <span>{master.subject} · {master.badge.slice(0, 4)}</span>
                    </div>
                  </div>

                  <div className="master-gallery-body">
                    <div className="master-card-header">
                      <h3 className="master-card-name">{master.name}</h3>
                      <div className="master-card-exp">{master.experience}</div>
                    </div>

                    <p className="master-card-quote">“{master.quote}”</p>

                    <div className="master-card-footer-clean">
                      <button
                        type="button"
                        className={`master-voice-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={() => toggleMasterAudio(master)}
                        title={isPlaying ? "暂停名师原声" : "试听名师原声"}
                      >
                        {isPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{isPlaying ? '原声播报中' : '试听原声'}</span>
                      </button>
                      <button
                        type="button"
                        className="master-1v1-btn"
                        onClick={() => onNavigate('studio')}
                      >
                        <span>向TA请教</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================
          ACT II: 4-ACT CINEMATIC PIPELINE (四幕沉浸全景剧场)
          ================================================================= */}
      <section id="tour-stage-section" className="apple-fullbleed-band apple-fullbleed-band--dark">
        <div className="apple-stage-container">
          
          <div className="apple-chapter-ribbon">
            <BookOpen size={13} />
            <span>CHAPTER 01 · 循迹 · 四幕因果全息剧场 (THE CAUSAL LOOP)</span>
          </div>

          <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', marginBottom: 16 }}>
            从草稿纸专注阻滞<br />
            <span>到专属名师微课即席生成</span>
          </h2>
          <p className="apple-pro-subtitle" style={{ marginBottom: 40, textWrap: 'balance' }}>
            四大核心感知与认知计算模块，一气呵成。
          </p>

          {/* Apple iOS-Style Segmented Capsule Bar */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="apple-segmented-capsule-bar">
              {[
                { idx: 0, label: '01 毫米级学情', icon: Activity },
                { idx: 1, label: '02 IRT 认知反应', icon: BarChart2 },
                { idx: 2, label: '03 5D 教学重组', icon: Sliders },
                { idx: 3, label: '04 虚拟微课剧场', icon: Tv },
              ].map((step) => {
                const IconComp = step.icon;
                return (
                  <button
                    key={step.idx}
                    type="button"
                    className={`apple-segmented-capsule-item ${activeStep === step.idx ? 'active' : ''}`}
                    onClick={() => setActiveStep(step.idx)}
                  >
                    <IconComp size={15} />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* The Apple Pro Display Hardware Stage */}
          <div className="apple-pro-display-frame" style={{ minHeight: 380 }}>
            <div key={activeStep} className="apple-stage-transition">
              
              {/* STAGE 01: 毫米级学情感知舱 */}
              {activeStep === 0 && (
                <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span className="badge badge-blue">POD 01 · 毫米级视觉学情感知舱</span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>60fps 连续视线追踪</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    89.4%
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'stretch', marginBottom: 24 }}>
                  
                  {/* EEG & Attention Waves */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: 22, border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>专注微震脑电脉冲 (EEG PULSE)</span>
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span className="apple-status-dot apple-status-dot--primary" />
                          <span>沉浸搜寻</span>
                        </span>
                      </div>
                      <svg viewBox="0 0 300 70" style={{ width: '100%', height: 75, overflow: 'visible' }}>
                        <path
                          d={`M 0 35 Q 40 ${35 + Math.sin(waveOffset) * 12} 80 35 T 160 35 T 240 ${35 + Math.cos(waveOffset) * 10} T 300 35`}
                          fill="none"
                          stroke="var(--accent-primary)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="font-mono-telemetry" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-glass)' }}>
                      <span>今日专注: {focusMinutes} min</span>
                      <span>眨眼频次: 14 次/min</span>
                    </div>
                  </div>

                  {/* Simulated Student Draft Paper */}
                  <div className="apple-draft-paper">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>草稿纸演算与视网膜注视热点</span>
                      <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '11px', fontWeight: 750 }}>X: 184 · Y: 312</span>
                    </div>

                    <div style={{ position: 'relative', height: 95 }}>
                      {/* Handwritten Math Formula Simulation on Draft Paper */}
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                        <div>f'(x) = 2x - a/x = (2x² - a)/x</div>
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>令 f'(x) = 0 =&gt; x₀ = √(a/2)</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>第3步: 对称差放缩阻滞... ?</div>
                      </div>

                      {/* Gaze Focus Rings on stuck step */}
                      <div style={{ position: 'absolute', right: 20, top: 20 }}>
                        <svg viewBox="0 0 100 60" style={{ width: 100, height: 60 }}>
                          <ellipse cx="50" cy="30" rx="36" ry="20" fill="none" stroke="rgba(0,113,227,0.2)" strokeWidth="1.5" />
                          <circle cx="50" cy="30" r="14" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" className="apple-gaze-pulse-ring" />
                          <circle cx={`${50 + Math.sin(waveOffset * 0.7) * 2}`} cy={`${30 + Math.cos(waveOffset * 0.6) * 1.5}`} r="5" fill="var(--accent-primary)" />
                        </svg>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: 10 }}>
                      <span className="apple-status-dot apple-status-dot--primary" />
                      <span>视线锁定：在对称差放缩临界点停顿 18.4s</span>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>实时捕获阻滞时段: 18.4 分钟</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('collect')}>
                    <span>进入感知控制台</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 02: IRT 认知反应中枢 */}
            {activeStep === 1 && (
          <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--text-main)', borderRadius: 9999, fontSize: '12px', padding: '4px 12px', fontWeight: 650 }}>
                      POD 02 · 项目反应理论 (IRT) 认知反应中枢
                    </span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>三参数 Logistic 拟合</span>
                  </div>
                  <div className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    潜能 <strong style={{ color: 'var(--accent-primary)', fontSize: '2rem' }}>θ = +{irtTheta.toFixed(2)}</strong>
                  </div>
            </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border-glass)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
                    <span>P(θ) 掌握概率函数曲线</span>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span className="apple-status-dot apple-status-dot--primary" />
                      <span>卡点: {weakPoint}</span>
              </span>
                  </div>
                  <svg viewBox="0 0 460 120" style={{ width: '100%', height: 120 }}>
                    <line x1="30" y1="100" x2="440" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    <line x1="30" y1="10" x2="30" y2="100" stroke="var(--border-glass)" strokeWidth="1" />
                    <path
                      d={`M 30 95 C 100 95 ${150 + irtTheta * 15} 60 ${220 + irtTheta * 15} 30 C 270 15 360 15 440 15`}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="3.5"
                    />
                    <circle cx={`${220 + irtTheta * 15}`} cy="30" r="7" fill="var(--accent-primary)" />
                    <text x={`${220 + irtTheta * 15}`} y="18" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="700">
                      林同学实际掌握点 (P=0.38)
                    </text>
                  </svg>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>潜能模拟调节:</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={irtTheta}
                      onChange={(e) => setIrtTheta(Number(e.target.value))}
                      className="apple-ios-slider"
                      style={{
                        flex: 1,
                        background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${((irtTheta - 0.5) / 2) * 100}%, #e5e5ea ${((irtTheta - 0.5) / 2) * 100}%, #e5e5ea 100%)`
                      }}
                    />
                    <span className="font-mono-telemetry" style={{ fontSize: '14px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      θ = {irtTheta.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>推断置信度: 94% · 根因: 对数均值对称化放缩盲区</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('diagnose')}>
                    <span>进入认知热力矩阵</span>
                    <ArrowRight size={14} />
              </button>
                </div>
              </div>
            )}

            {/* STAGE 03: 5D 教学重组台 */}
            {activeStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--text-main)', borderRadius: 9999, fontSize: '12px', padding: '4px 12px', fontWeight: 650 }}>
                      POD 03 · 5D 教学基因重组台
                    </span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>多维拟物微调</span>
                  </div>
                  <div className="preset-chip-row" style={{ margin: 0 }}>
                    {PRESETS.map((p) => (
              <button
                        key={p.id}
                        type="button"
                        className={`preset-chip ${selectedPreset === p.id ? 'active' : ''}`}
                        onClick={() => handlePresetSelect(p)}
                      >
                        {p.name}
              </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                    {AXES.slice(0, 4).map((axis) => {
                      const deg = -90 + scores[axis.key] * 180;
                      return (
                        <div key={axis.key} style={{ textAlign: 'center' }}>
                          <div className="rotary-dial-container" style={{ margin: '0 auto 8px' }}>
                            <div className="rotary-dial-pointer" style={{ transform: `rotate(${deg}deg)` }} />
                            <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'var(--text-muted)', zIndex: 1 }}>
                              {Math.round(scores[axis.key] * 100)}%
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 650 }}>{axis.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RadarChart5D scores={scores} size={200} showLabels showComposite highlightColor="var(--accent-primary)" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>因材施教适配度: 100% · 苏格拉底递进反问</span>
              <button
                    type="button"
                    className="apple-btn-pill-primary"
                    style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}
                    onClick={() => {
                      const el = document.getElementById('workbench-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>调谐参数</span>
                    <ArrowRight size={14} />
              </button>
            </div>
              </div>
            )}

            {/* STAGE 04: 微课演播剧场 */}
            {activeStep === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--text-main)', borderRadius: 9999, fontSize: '12px', padding: '4px 12px', fontWeight: 650 }}>
                      POD 04 · 虚拟名师微课演播剧场
                    </span>
                    <span style={{ marginLeft: 12, fontSize: '13px', color: 'var(--text-muted)' }}>思维阶梯演算</span>
                </div>
                  <span style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-subtle)', color: 'var(--accent-primary)', borderRadius: 9999, fontSize: '12px', padding: '4px 12px', fontWeight: 650 }}>
                    +84% 思维自驱力
                  </span>
              </div>

                {/* 4K Digital Classroom Visual HUD Banner */}
                <div className="hud-visual-banner" style={{ marginBottom: 20 }}>
                  <img
                    src="./demo_videos/merged_poster.jpg"
                    alt="4K微课演播实况预览"
                    className="hud-visual-banner-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './demo_videos/merged_poster.jpg';
                    }}
                  />
                  <div className="hud-visual-banner-overlay" />
                  <div className="hud-visual-badge-floating">
                    <span className="apple-status-dot apple-status-dot--primary" />
                    <span>4K 虚拟名师板书同步演算 · 帧级数字人实时驱动</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
                    <span style={{ fontSize: '13px', fontWeight: 650, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      王特级 · 《导数压轴极值点偏移巧构造》沉浸式示范课
                    </span>
                    <span className="font-mono-telemetry" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 6, backdropFilter: 'blur(8px)' }}>
                      时长 03:42 · 1080P/60
                    </span>
                  </div>
                </div>

                {/* Visual Thinking Ascent Spectrum & Contrast Chart */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="apple-status-dot apple-status-dot--primary" />
                      名师微课三阶思维攀登图谱 (Cognitive Ascent Ladder)
                    </span>
                    <span className="badge badge-cyan font-mono-telemetry" style={{ fontSize: '11px' }}>
                      登顶自悟率 98%
                    </span>
                  </div>

                  <div className="stage4-ascent-grid">
                    <div className="stage4-ascent-step">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 750, color: 'var(--accent-primary)' }}>阶梯 ①</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>阻滞突破</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-main)' }}>洞察极值对称</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>锁定 x₀=√(a/2) 两侧切线斜率异同</div>
                      <div style={{ height: 4, background: 'rgba(0,113,227,0.2)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: '38%', height: '100%', background: 'var(--accent-primary)', borderRadius: 2 }} />
                      </div>
                    </div>

                    <div className="stage4-ascent-step">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 750, color: 'var(--accent-primary)' }}>阶梯 ②</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>反问搭桥</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-main)' }}>构造对称差函数</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>F(x) = f(x) - f(2x₀ - x) 降维单调性</div>
                      <div style={{ height: 4, background: 'rgba(0,113,227,0.2)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: '74%', height: '100%', background: 'var(--accent-primary)', borderRadius: 2 }} />
                      </div>
                    </div>

                    <div className="stage4-ascent-step tier-3">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 750, color: '#f59e0b' }}>阶梯 ③ 🏆</span>
                        <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>举一反三</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-main)' }}>公理直觉内化</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>变式秒杀，考点彻底化为本能记忆</div>
                      <div style={{ height: 4, background: 'rgba(245,158,11,0.2)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: '100%', height: '100%', background: '#f59e0b', borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Generic AI Contrast Bar */}
                  <div style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: 'var(--bg-surface)',
                    border: '1px dashed var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>⚠️ 通用基准 AI 灌输对照：</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>直接硬套对数均值公式 ➔ 零思考阶梯 ➔ 遇新题立即失分</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                      留存仅 14%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>板书支持 LaTeX KaTeX 实时几何推导</span>
                  <button type="button" className="apple-btn-pill-primary" style={{ height: '36px', padding: '0 20px', fontSize: '13px' }} onClick={() => onNavigate('studio')}>
                    <span>试听专属微课</span>
                    <ArrowRight size={14} />
                  </button>
            </div>
          </div>
            )}

                    </div>
                  </div>

          {/* Bottom Stage Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                  <button
              type="button"
              className="reel-nav-btn"
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              style={{ opacity: activeStep === 0 ? 0.4 : 1 }}
              title="上一阶段"
              aria-label="上一阶段"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono-telemetry" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 650 }}>
              STAGE {activeStep + 1} / 4
            </span>
            <button
              type="button"
              className="reel-nav-btn"
              onClick={() => setActiveStep((prev) => Math.min(3, prev + 1))}
              disabled={activeStep === 3}
              style={{ opacity: activeStep === 3 ? 0.4 : 1 }}
              title="下一阶段"
              aria-label="下一阶段"
            >
              <ChevronRight size={16} />
                  </button>
                </div>

          </div>
        </section>

      {/* =================================================================
          ACT III: APPLE PRO STUDIO WORKBENCH (5D 认知基因调优实验室)
          ================================================================= */}
      <section id="workbench-section" className="apple-fullbleed-band apple-fullbleed-band--light">
        <div className="apple-stage-container">
          
          <div className="apple-chapter-ribbon">
            <Sliders size={13} />
            <span>CHAPTER 02 · 破局 · 5D 认知基因调谐工作台 (THE WORKBENCH)</span>
          </div>

          <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', maxWidth: 880, marginBottom: 16 }}>
            自主调节 5D 认知基因<br />
            <span>实时透视生成差距</span>
          </h2>
          <p className="apple-pro-subtitle" style={{ maxWidth: 680, marginBottom: 36, textWrap: 'balance' }}>
            轻拉滑块或输入您关心的考题，同屏直击特级名师启发支架与通用大模型的死板结论。
          </p>

          {/* Apple Spotlight Search / Input Capsule */}
          <form className="apple-spotlight-wrap" onSubmit={handleQuestionSubmit}>
            <Search size={18} className="apple-spotlight-icon" />
            <input
              type="text"
              className="apple-spotlight-input"
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              placeholder="输入数学考题或提问，例如：'圆锥曲线离心率的统一几何意义？'"
            />
            <button type="submit" className="apple-spotlight-btn">
              <span>实时求证</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Preset Question Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setUserQuestion(q)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: `1px solid ${userQuestion === q ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: userQuestion === q ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                  color: userQuestion === q ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: userQuestion === q ? 650 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: userQuestion === q ? '0 2px 10px rgba(0,113,227,0.15)' : 'none'
                }}
              >
                {q}
              </button>
            ))}
                      </div>

          <div className="workbench-wrap">
            
            {/* Left Column: Apple Pro Inspector */}
            <div className="workbench-controls apple-squircle-pod">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-main)' }}>
                  名师风格预设
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 650 }}>
                  {PRESETS.find((p) => p.id === selectedPreset)?.name || '自定义'}
                </span>
                      </div>

              <div className="preset-chip-row" style={{ marginBottom: 24 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`preset-chip ${selectedPreset === p.id ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* 5D Axis Apple iOS Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {AXES.map((axis) => {
                  const val = scores[axis.key];
                  return (
                    <div key={axis.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-main)' }}>
                          {axis.label}
                        </span>
                        <span className="font-mono-telemetry" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {Math.round(val * 100)}%
                        </span>
                    </div>
                    <input
                      type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={val}
                        onChange={(e) => handleSliderChange(axis.key, Number(e.target.value))}
                        className="apple-ios-slider"
                        style={{
                          background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${val * 100}%, #e5e5ea ${val * 100}%, #e5e5ea 100%)`
                        }}
                      />
                  </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                💡 调节滑块将即席重构右侧专属名师的启发解题思维链与知识迁移深度。
            </div>

                </div>

            {/* Visual Dual-Track Thinking Path & Retention Graph */}
            <div className="thinking-path-canvas" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Network size={18} style={{ color: 'var(--accent-primary)' }} />
                    <span>双轨思维路径图谱：名师启发登顶 vs 通用AI直坠</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                    基于当前 5D 参数实时解构：学生认知参与度与遗忘衰减动态映射
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-blue font-mono-telemetry" style={{ fontSize: '11px' }}>
                    名师留存率 {safeMasterRetention}%
                  </span>
                  <span className="badge badge-rose font-mono-telemetry" style={{ fontSize: '11px' }}>
                    AI灌输留存 14%
                  </span>
                </div>
              </div>

              {/* Dual Track Grid */}
              <div className="thinking-dual-track">
                
                {/* Track 1: Master Teacher Ladder Track */}
                <div className="thinking-track-card thinking-track-card--master">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
                      <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>定制名师思维阶梯</strong>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(0,113,227,0.12)', padding: '2px 8px', borderRadius: 9999 }}>
                      启发式内化
                    </span>
                  </div>

                  {/* Highlight Formula Pill */}
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '12px',
                    color: 'var(--accent-primary)',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    marginBottom: 14,
                    fontWeight: 700
                  }}>
                    F(x) = f(x) - f(2x₀ - x) 构造对称差
                  </div>

                  {/* 4 Ladder Nodes */}
                  <div className="thinking-flow-steps">
                    <div className="thinking-flow-node thinking-flow-node--active">
                      <div className="node-icon-bubble node-icon-bubble--master">1</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--text-main)' }}>毫米级视线阻滞溯源</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>精准捕获极值点放缩停顿 18.4s</div>
                      </div>
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                    </div>

                    <div className="thinking-flow-node thinking-flow-node--active">
                      <div className="node-icon-bubble node-icon-bubble--master">2</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--text-main)' }}>苏格拉底递进反问点拨</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>"观察两边斜率符号有何几何关联？"</div>
                      </div>
                      <Sparkles size={14} style={{ color: '#f59e0b' }} />
                    </div>

                    <div className="thinking-flow-node thinking-flow-node--active">
                      <div className="node-icon-bubble node-icon-bubble--master">3</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--text-main)' }}>师生共构思维支架</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>学生自发顿悟，将二元极值降至一元</div>
                      </div>
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                    </div>

                    <div className="thinking-flow-node thinking-flow-node--active" style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' }}>
                      <div className="node-icon-bubble" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>4</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: '#f59e0b' }}>公理直觉形成 · 变式秒杀</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>考场变式自如破解，核心思维留存 {safeMasterRetention}%</div>
                      </div>
                      <Award size={14} style={{ color: '#f59e0b' }} />
                    </div>
                  </div>

                  {/* Retention Curve Preview SVG */}
                  <div className="retention-curve-box">
                    <div className="retention-curve-header">
                      <span>7天记忆留存衰减模型 (Ebbinghaus Retained)</span>
                      <span style={{ color: 'var(--accent-primary)' }}>高位稳定 {safeMasterRetention}%</span>
                    </div>
                    <svg viewBox="0 0 280 60" style={{ width: '100%', height: 60, overflow: 'visible' }}>
                      <line x1="10" y1="50" x2="270" y2="50" stroke="var(--border-glass)" strokeWidth="1" />
                      <line x1="10" y1="10" x2="10" y2="50" stroke="var(--border-glass)" strokeWidth="1" />
                      {/* Master retention curve (stays high) */}
                      <path
                        d={`M 10 14 C 70 14, 150 ${50 - (safeMasterRetention * 0.4)}, 270 ${50 - (safeMasterRetention * 0.4)}`}
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="270" cy={50 - (safeMasterRetention * 0.4)} r="4" fill="var(--accent-primary)" />
                      <text x="260" y={42 - (safeMasterRetention * 0.4)} fill="var(--accent-primary)" fontSize="10" fontWeight="750" textAnchor="end">
                        {safeMasterRetention}%
                      </text>
                      <text x="15" y="44" fill="var(--text-muted)" fontSize="9">第1天</text>
                      <text x="140" y="44" fill="var(--text-muted)" fontSize="9">第3天</text>
                      <text x="245" y="44" fill="var(--text-muted)" fontSize="9">第7天</text>
                    </svg>
                  </div>
                </div>

                {/* Track 2: Generic AI Cliff Fall Track */}
                <div className="thinking-track-card thinking-track-card--baseline">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={18} style={{ color: '#94a3b8' }} />
                      <strong style={{ fontSize: '15px', color: 'var(--text-muted)' }}>通用基准大模型</strong>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 9999 }}>
                      断崖式硬灌
                    </span>
                  </div>

                  {/* Highlight Formula Pill */}
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'var(--bg-surface)',
                    border: '1px dashed var(--border-glass)',
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    marginBottom: 14
                  }}>
                    f'(x) = 0 =&gt; 暴力套入对数均值公式
                  </div>

                  {/* 4 Cliff Nodes */}
                  <div className="thinking-flow-steps">
                    <div className="thinking-flow-node">
                      <div className="node-icon-bubble node-icon-bubble--baseline">1</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>机械解析输入题干</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>缺少视线捕捉，不知学生卡在何处</div>
                      </div>
                    </div>

                    <div className="thinking-flow-node">
                      <div className="node-icon-bubble node-icon-bubble--baseline">2</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>直接灌输终极步骤</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>剥夺独立反思，硬给高难解题套路</div>
                      </div>
                    </div>

                    <div className="thinking-flow-node thinking-flow-node--failed">
                      <div className="node-icon-bubble node-icon-bubble--failed">✕</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>学生思考参与度归零</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>抄写答案形成假懂，实际概念依然混淆</div>
                      </div>
                    </div>

                    <div className="thinking-flow-node thinking-flow-node--failed">
                      <div className="node-icon-bubble node-icon-bubble--failed">✕</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>变式即刻崩盘 · 留存断崖坠落</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2小时后艾宾浩斯留存急剧下滑至 14%</div>
                      </div>
                    </div>
                  </div>

                  {/* Retention Curve Cliff Fall SVG */}
                  <div className="retention-curve-box">
                    <div className="retention-curve-header">
                      <span>7天记忆留存衰减模型 (Ebbinghaus Plunge)</span>
                      <span style={{ color: '#ef4444' }}>断崖跌落 14%</span>
                    </div>
                    <svg viewBox="0 0 280 60" style={{ width: '100%', height: 60, overflow: 'visible' }}>
                      <line x1="10" y1="50" x2="270" y2="50" stroke="var(--border-glass)" strokeWidth="1" />
                      <line x1="10" y1="10" x2="10" y2="50" stroke="var(--border-glass)" strokeWidth="1" />
                      {/* Baseline cliff curve (plunges down) */}
                      <path
                        d="M 10 14 C 40 14, 70 44, 270 44"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                      />
                      <circle cx="270" cy="44" r="3.5" fill="#ef4444" />
                      <text x="260" y="38" fill="#ef4444" fontSize="10" fontWeight="700" textAnchor="end">
                        14%
                      </text>
                      <text x="15" y="44" fill="var(--text-muted)" fontSize="9">第1天</text>
                      <text x="140" y="44" fill="var(--text-muted)" fontSize="9">第3天</text>
                      <text x="245" y="44" fill="var(--text-muted)" fontSize="9">第7天</text>
                    </svg>
                  </div>
                </div>

              </div>

              {/* Bottom Telemetry Bar */}
              <div style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💡 调节左侧 5D 滑块，右侧名师阶梯高度与留存曲线将实时随启发深度动态提升</span>
                </div>
                <button
                  type="button"
                  className="apple-btn-pill-primary"
                  style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}
                  onClick={() => onNavigate('compose', { teacherSection: 'compose', initialScores: scores })}
                >
                  <span>以此思维图谱注入工坊</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

              </div>
          </div>
        </section>

      {/* =================================================================
          ACT IV: MONUMENTAL TELEMETRY (苹果发布会级数字展牌)
          ================================================================= */}
      <section className="apple-fullbleed-band" style={{ padding: '60px 0 100px' }}>
        <div className="apple-stage-container">
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="apple-chapter-ribbon" style={{ margin: '0 auto 16px' }}>
              <Zap size={13} />
              <span>EPILOGUE · 终章 · 毫米级实证跃迁 (THE EVIDENCE)</span>
      </div>
            <h2 className="apple-monumental-headline" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)', margin: 0, textWrap: 'balance' }}>
              实证数据，写下认知的真实跃迁
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            
            <div className="apple-keynote-tile card-hover-lift">
              <div className="apple-keynote-stat-val highlight font-mono-telemetry">{animatedPrecision} mm</div>
              <div className="apple-keynote-stat-title">微视线阻滞捕捉</div>
              <div className="apple-keynote-stat-desc">60fps 视网膜注视流，精确重构草稿纸顿挫点</div>
            </div>

            <div className="apple-keynote-tile card-hover-lift">
              <div className="apple-keynote-stat-val font-mono-telemetry">&lt; {animatedConvergence}s</div>
              <div className="apple-keynote-stat-title">IRT 认知穿透收敛</div>
              <div className="apple-keynote-stat-desc">三参数动态 Logistic 拟合，秒级定位知识盲区</div>
            </div>

            <div className="apple-keynote-tile card-hover-lift">
              <div className="apple-keynote-stat-val highlight">5D 空间</div>
              <div className="apple-keynote-stat-title">名师教学基因重组</div>
              <div className="apple-keynote-stat-desc">启发反问、公理破局、数形转化自由即席编译</div>
            </div>

            <div className="apple-keynote-tile card-hover-lift">
              <div className="apple-keynote-stat-val highlight font-mono-telemetry">+{animatedRetention}%</div>
              <div className="apple-keynote-stat-title">核心思维留存率</div>
              <div className="apple-keynote-stat-desc">启发式支架引导，彻底突破各学段变式瓶颈</div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
