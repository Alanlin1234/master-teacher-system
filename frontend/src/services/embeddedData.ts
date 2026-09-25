/** 内置高拟真教学离线与静态托管兜底引擎 */

export const EMBEDDED_DEMO_ACCOUNTS = [
  { username: "demo_student", label: "学生体验账号", portalRole: "student", role: "user", password: "123" },
  { username: "demo_teacher", label: "特级名师账号", portalRole: "teacher", role: "user", password: "123" },
  { username: "admin", label: "平台管理员", portalRole: "teacher", role: "admin", password: "admin" }
];

export const EMBEDDED_TEACHERS = [
  {
    id: "t1",
    name: "王崇林",
    subject: "数学",
    avatar: "👩‍🏫",
    photoUrl: "./avatars/t1.svg",
    description: "特级教师，从教22年，奥数金牌教练，擅长启发式拆解与因材施教。",
    style: "启发拆解、逻辑严密、由浅入深",
    personality: "严谨沉稳、富有耐心、善于鼓励",
    strengths: ["高观点拆解微积分与函数难点", "善于运用图解引导学生自建解题模型", "思维脉络层次分明"],
    weaknesses: ["教学进度紧凑", "思维挑战要求高"],
    materials: [
      { id: "m1-1", title: "导数切线综合大题模型归纳与解构", type: "讲义", uploadDate: "2026-03-10" },
      { id: "m1-2", title: "立体几何空间向量法思维导图与速记口诀", type: "课件", uploadDate: "2026-03-12" }
    ],
    dh_model_name: "wang_chonglin_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.88, personality: 0.82, strengths: 0.94, method: 0.91, communication: 0.79 }
  },
  {
    id: "t2",
    name: "李清韵",
    subject: "语文",
    avatar: "👩‍🏫",
    photoUrl: "./avatars/t2.svg",
    description: "古典文学博士，文风典雅，课堂生动富于诗意，注重文学审美与思辨写作。",
    style: "情境沉浸、诗意启发、古今勾连",
    personality: "温润儒雅、博学风趣、极具感染力",
    strengths: ["善于以文史典故点亮现代作文构思", "经典文本沉浸式细读与意象剖析", "提升思辨表达深度"],
    weaknesses: ["考点应试拆分偏少", "注重情感体验"],
    materials: [
      { id: "m2-1", title: "高考议论文思辨框架与高级论据精粹", type: "讲义", uploadDate: "2026-03-14" }
    ],
    dh_model_name: "li_qingyun_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.92, personality: 0.95, strengths: 0.85, method: 0.88, communication: 0.96 }
  },
  {
    id: "t3",
    name: "张曼玲",
    subject: "英语",
    avatar: "👩‍💼",
    photoUrl: "./avatars/t3.svg",
    description: "海外名校同传硕士，发音地道纯正，擅长情境互动演练与高阶学术表达。",
    style: "全英沉浸、任务驱动、纯正语感",
    personality: "热情奔放、思维敏捷、极富激励性",
    strengths: ["打破哑巴英语，打造高频开口场景", "长难句结构一秒透视法", "母语思维写作进阶"],
    weaknesses: ["词汇记忆注重自然吸收，死记硬背较少"],
    materials: [
      { id: "m3-1", title: "外刊高频熟词生义与写作亮点词汇表", type: "词表", uploadDate: "2026-03-15" }
    ],
    dh_model_name: "zhang_manling_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.90, personality: 0.93, strengths: 0.89, method: 0.85, communication: 0.94 }
  },
  {
    id: "t4",
    name: "陈建国",
    subject: "物理",
    avatar: "👨‍🔬",
    photoUrl: "./avatars/t4.svg",
    description: "全国中学生物理竞赛金牌指导教师，注重物理本质直觉与实验建模。",
    style: "实物建模、图景推演、直觉启发",
    personality: "求真务实、一丝不苟、风趣幽默",
    strengths: ["将抽象电磁场转化为具象几何图景", "动力学综合过程多视角拆解", "破除学生公式依赖症"],
    weaknesses: ["对基础算力训练要求极其严苛"],
    materials: [
      { id: "m4-1", title: "带电粒子在复合场中运动轨迹20类模型", type: "图解", uploadDate: "2026-03-18" }
    ],
    dh_model_name: "chen_jianguo_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.85, personality: 0.86, strengths: 0.96, method: 0.92, communication: 0.81 }
  },
  {
    id: "t5",
    name: "苏佩珊",
    subject: "化学",
    avatar: "👩‍🔬",
    photoUrl: "./avatars/t5.svg",
    description: "国家级骨干教师，微观结构可视化教学开创者，擅长有机推断与化工工艺流程剖析。",
    style: "微观可视、网络化联想、实验溯源",
    personality: "细致入微、和蔼可亲、条理清晰",
    strengths: ["以电子云转移视角通透解读反应机理", "工业流程图解构破题四部法", "易错考点矩阵对比"],
    weaknesses: ["板书容量大，需学生全神贯注"],
    materials: [
      { id: "m5-1", title: "高考有机合成逆推思路终极秘籍", type: "讲义", uploadDate: "2026-03-19" }
    ],
    dh_model_name: "su_peishan_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.87, personality: 0.89, strengths: 0.91, method: 0.90, communication: 0.88 }
  },
  {
    id: "t6",
    name: "陆宏远",
    subject: "生物",
    avatar: "👨‍🔬",
    photoUrl: "./avatars/t6.svg",
    description: "生命科学博士，生动讲述生命演化奥秘，遗传概率与分子调节链条教学权威。",
    style: "系统演进、概念溯源、模型推演",
    personality: "睿智开明、逻辑井然、充满探索欲",
    strengths: ["遗传系谱图分析秒杀树状法", "光合与细胞呼吸综合曲线深度解析", "实验设计规范精准拿分"],
    weaknesses: ["信息密度极高"],
    materials: [
      { id: "m6-1", title: "分子遗传学调节机制全流程图谱", type: "图解", uploadDate: "2026-03-20" }
    ],
    dh_model_name: "lu_hongyuan_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.84, personality: 0.85, strengths: 0.93, method: 0.89, communication: 0.83 }
  },
  {
    id: "t7",
    name: "周思敏",
    subject: "历史",
    avatar: "👩‍🏫",
    photoUrl: "./avatars/t7.svg",
    description: "通晓古今中外制度变迁，擅长以唯物史观构建多维时空坐标与大历史视野。",
    style: "时空定位、长时段透视、史料实证",
    personality: "沉静深刻、视野开阔、思辨敏锐",
    strengths: ["纵横勾连中西政治文明演进脉络", "论述题高分史论结合架构", "突破机械年代记忆"],
    weaknesses: ["较少纯死板考点背诵灌输"],
    materials: [
      { id: "m7-1", title: "近现代全球化浪潮演进坐标轴与答题论纲", type: "讲义", uploadDate: "2026-03-21" }
    ],
    dh_model_name: "zhou_simin_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.91, personality: 0.90, strengths: 0.88, method: 0.92, communication: 0.87 }
  },
  {
    id: "t8",
    name: "赵天成",
    subject: "地理",
    avatar: "👨‍🏫",
    photoUrl: "./avatars/t8.svg",
    description: "国家地理签约学者，空间立体解析法首创者，将大气洋流地貌讲得透彻灵动。",
    style: "空间立体、因果推演、图文合一",
    personality: "洒脱豁达、形象直观、旁征博引",
    strengths: ["等值线与地球自转光照图三秒定位", "区域综合分析模板化与个性化结合", "气候成因逻辑推演"],
    weaknesses: ["绘图要求高"],
    materials: [
      { id: "m8-1", title: "全国卷自然地理经典综合题因果链条梳理", type: "课件", uploadDate: "2026-03-22" }
    ],
    dh_model_name: "zhao_tiancheng_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.93, personality: 0.91, strengths: 0.89, method: 0.94, communication: 0.90 }
  },
  {
    id: "t9",
    name: "韩晓峰",
    subject: "政治",
    avatar: "👨‍💼",
    photoUrl: "./avatars/t9.svg",
    description: "法学与哲学双背景，热点时事剖析第一人，擅长哲学原理生活化与法治逻辑构建。",
    style: "时政切入、逻辑辩证、精准术语",
    personality: "观点鲜明、引人深思、严密理性",
    strengths: ["哲学四项基本原理题眼一眼识破", "经济高质量发展新名词逻辑图解", "主观题踩点评分标准精准击穿"],
    weaknesses: ["对逻辑闭环要求极高"],
    materials: [
      { id: "m9-1", title: "最新中央大政方针考点转化与主观答题术语集", type: "讲义", uploadDate: "2026-03-23" }
    ],
    dh_model_name: "han_xiaofeng_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.86, personality: 0.87, strengths: 0.92, method: 0.91, communication: 0.89 }
  },
  {
    id: "t10",
    name: "高志伟",
    subject: "数学",
    avatar: "👨‍🏫",
    photoUrl: "./avatars/t10.svg",
    description: "百万名师博主，幽默风趣段子连珠，将最枯燥的高中数学圆锥曲线讲成热血小说。",
    style: "幽默风趣、逆向秒杀、段子教学",
    personality: "激情澎湃、毫无架子、深得学生喜爱",
    strengths: ["秒杀公式与本质推导双结合", "精准预判考场易错心魔", "调动后进生数学学习热情"],
    weaknesses: ["课堂节奏飞快"],
    materials: [
      { id: "m10-1", title: "圆锥曲线齐次化与设而不求大招合集", type: "秘籍", uploadDate: "2026-03-24" }
    ],
    dh_model_name: "gao_zhiwei_avatar",
    dh_model_video_url: "./demo_videos/merged.mp4",
    dim_scores: { style: 0.97, personality: 0.98, strengths: 0.90, method: 0.86, communication: 0.97 }
  }
];

export const DIMENSION_LABELS: Record<string, string> = {
  style: "上课风格",
  personality: "人格特征",
  strengths: "核心优点",
  method: "教学方法",
  communication: "沟通方式"
};
