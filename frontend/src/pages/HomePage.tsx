import React, { useState, useRef, useMemo } from 'react';
import { TeacherDigitalHuman } from '../components/TeacherDigitalHuman';
import { RadarChart5D } from '../components/RadarChart5D';
import { RichMarkdown } from '../components/RichMarkdown';
import { speechService } from '../services/speech';
import { teachersApi } from '../services/api';
import {
  GraduationCapIcon,
  MessageSquareIcon,
  DnaIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  SparklesIcon,
  SlidersIcon,
  VolumeIcon,
  BookOpenIcon,
  SearchIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshIcon,
  SendIcon,
} from '../components/Icons';
import { useHeroEntrance, useCountUp } from '../lib/gsap';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

type DemoTopicKey = 'math' | 'physics' | 'chinese';

interface DemoTopicInfo {
  id: DemoTopicKey;
  label: string;
  Icon: React.FC<any>;
  questionTitle: string;
  question: string;
}

const DEMO_TOPICS: Record<DemoTopicKey, DemoTopicInfo> = {
  math: {
    id: 'math',
    label: '高中数学',
    Icon: BookOpenIcon,
    questionTitle: '导数极值与驻点本质深度探究',
    question: '已知函数 $f(x) = \\ln x - ax$ ($a \\in \\mathbb{R}$)，求 $f(x)$ 的单调区间与极值点，并透彻阐释：为什么“导数等于 0”只是极值点的必要条件而非充分条件？',
  },
  physics: {
    id: 'physics',
    label: '高中物理',
    Icon: SparklesIcon,
    questionTitle: '电磁感应双棒动力学与焦耳热分配',
    question: '水平光滑平行导轨置于匀强磁场 $B$ 中，两棒质量与电阻分别为 $m_1, R_1$ 和 $m_2, R_2$。初速度为 $v_0$ 与 0，求系统稳态速度及双棒总焦耳热分配？',
  },
  chinese: {
    id: 'chinese',
    label: '高中文科',
    Icon: GraduationCapIcon,
    questionTitle: '赤壁赋思辨哲理与文言虚词意象',
    question: '苏轼在《赤壁赋》中如何由“水与月”的变与不变阐发旷达哲思？其中虚词“之”与“其”在情绪转折中起到了怎样的推波助澜作用？',
  },
};

function generateLiveAnswer(
  topic: DemoTopicKey,
  scores: { style: number; personality: number; strengths: number; method: number; communication: number }
): string {
  const isRigorous = scores.style >= 0.82;
  const isExamTraps = scores.method >= 0.82;
  const isHighDim = scores.strengths >= 0.82;
  const isScholarly = scores.personality >= 0.82;
  const isStructured = scores.communication >= 0.82;

  if (topic === 'math') {
    const greeting = isScholarly
      ? '我们以严密的高等微积分公理体系来审视这一经典导数问题。'
      : '同学们好！我们今天用直观的几何图像和生动的变化率，把极值与导数的底层关系彻底吃透。';

    const opening = isRigorous
      ? `### 严格推导与区间单调性分析

函数的定义域必须优先保证：$D = (0, +\\infty)$。对 $f(x) = \\ln x - ax$ 关于 $x$ 求一阶导数：

$$f'(x) = \\frac{1}{x} - a = \\frac{1 - ax}{x} \\quad (x > 0)$$

对参数 $a$ 实施公理化符号分类讨论：

1. **若 $a \\le 0$**：
   对于任意 $x \\in (0, +\\infty)$，恒有 $-ax \\ge 0$，因此分子 $1 - ax > 0$。分母 $x > 0$，故：
   $$f'(x) > 0 \\quad (\\forall x > 0)$$
   函数 $f(x)$ 在定义域 $(0, +\\infty)$ 上**严格单调递增**，无极值点。

2. **若 $a > 0$**：
   令 $f'(x) = 0$，解得唯一驻点（驻波临界点）：
   $$x_0 = \\frac{1}{a}$$
   - 当 $x \\in \\left(0, \\frac{1}{a}\\right)$ 时，$1 - ax > 0 \\implies f'(x) > 0$，$f(x)$ 严格单调递增；
   - 当 $x \\in \\left(\\frac{1}{a}, +\\infty\\right)$ 时，$1 - ax < 0 \\implies f'(x) < 0$，$f(x)$ 严格单调递减。

   因此，点 $x = \\frac{1}{a}$ 为函数唯一的**严格极大值点**，极大值为：
   $$f\\left(\\frac{1}{a}\\right) = \\ln\\left(\\frac{1}{a}\\right) - a \\cdot \\frac{1}{a} = -\\ln a - 1$$`
      : `### 几何切线与函数变化率图解

我们不妨把 $f(x) = \\ln x - ax$ 想象成两股力量的拔河比赛：
- 前半部分 $\\ln x$ 是不断向上攀爬的自然对数（但随着 $x$ 增大，爬坡的步伐越来越慢）；
- 后半部分 $-ax$ 是一股匀速往下拉的线性阻尼。

函数的导数 $f'(x)$，正是你在任意时刻脚下的地面坡度（切线斜率）：

$$f'(x) = \\frac{1}{x} - a = \\frac{1 - ax}{x}$$

- 当 $x$ 很小（刚从 0 出发）时，$\\frac{1}{x}$ 极大，对数攀升力压倒阻尼，坡度为正，函数猛烈上冲；
- 当你爬到 $x = \\frac{1}{a}$ 时，对数上升的力恰好被阻尼抵消，此时切线水平（$f'(x) = 0$）；
- 一旦越过 $x = \\frac{1}{a}$，阻尼占据上风，切线斜率转为负数，函数开始走下坡路。因此 $x = \\frac{1}{a}$ 是一座天然的山峰最高点！`;

    const callout = isExamTraps
      ? `> [!IMPORTANT]
> **🎯 高考命题反套路陷阱：警惕“驻点即极值点”的逻辑误区**
> 
> 很多同学常把“导数等于 0 的点”与“极值点”画等号，在考场压轴题中丢分极其惨烈！
> 
> 1. **反例直击**：考察经典幂函数 $g(x) = x^3$。在原点处 $g'(0) = 0$（驻点），但观察导数符号：
>    $$x < 0 \\implies g'(x) = 3x^2 > 0; \\quad x > 0 \\implies g'(x) = 3x^2 > 0$$
>    导数在驻点左右**未发生正负号跨轴突变**！函数在 $x=0$ 处只是瞬间放平，随后继续昂首向上，因此 $x=0$ 绝非极值点，而是拐点！
> 2. **充分条件的判定准则**：驻点 $x_0$ 升格为极值点的充要条件是——导函数 $f'(x)$ 在穿过 $x_0$ 时**必须发生符号变号**（由正转负为极大值，由负转正为极小值）；或由二阶导判据 $f''(x_0) \\neq 0$ 确定。`
      : `> [!NOTE]
> **✦ 苏格拉底递进启发研讨：思考“导数等于0”的真实几何图景**
> 
> 请同学合上笔记本，在草稿纸上想象并动手画一画：
> 
> 假设你走在一座连绵起伏的山丘上，某一步你的脚底切线恰好完全水平（斜率为 0）。
> 请问：你这一刻站着的地方，**一定是山顶或山谷谷底吗？**
> 
> 有没有可能，你只是走上了一小段“台阶式的休息平台”，而平台的左右两侧其实全都是向上的坡路？
> 试着在纸上画出 $h(x) = x - \\sin x$ 在 $x=0$ 附近的切线与走势，看看你能悟出什么！`;

    const modelInsight = isHighDim
      ? `### 数形结合高维投影：双曲线割线模型

我们将导数方程 $f'(x) = 0$ 升维转化为两条独立几何曲线在第一象限的交点：

$$y_1 = \\frac{1}{x} \\quad (\\text{等轴双曲线分支}) \\qquad y_2 = a \\quad (\\text{参数水平割线})$$

- 当 $a \\le 0$ 时，水平线 $y_2 = a$ 位于 $x$ 轴下方，而双曲线 $y_1$ 严格悬浮于第一象限，两者绝无交点；
- 当 $a > 0$ 时，水平线必定横截双曲线于唯一几何交点 $\\left(\\frac{1}{a}, a\\right)$，且在交点左侧 $y_1 > y_2$，右侧 $y_1 < y_2$。
数形结合不仅让导数正负符号的跨轴变迁一目了然，更彻底根除了复杂代数讨论的失误风险！`
      : `### 名师极速通关口诀

- **一看定义域**：对数函数真数必大于零，切忌漏讨论边界；
- **二算一阶导**：通分化为标准分式，分子决定正负命运；
- **三定驻点根**：解方程找导数零点；
- **四画变号表**：穿针引线看变号，左正右负是山峰，左右同号非极值！`;

    const summary = isStructured
      ? `### 核心考法与思维导图

| 判定维度 | 必要条件阶段 | 充分条件验证 |
| :--- | :--- | :--- |
| **代数判据** | 求解代数方程 $f'(x) = 0$ 获取候选驻点 | 检验驻点邻域 $f'(x_0^-)$ 与 $f'(x_0^+)$ 是否异号 |
| **几何图像** | 切线斜率 $k = 0$（切线水平） | 曲线在切线两侧呈现峰谷凹凸转折，而非马鞍拐点 |
| **高考陷阱** | 误把 $f'(x)=0$ 当成极值点充分保证 | 遗漏定义域边界或忽略二阶变号检测 |`
      : `**名师温润结语**：数学的魅力就在于这种‘看似理所当然、实则步步精微’的逻辑美感。记住，极值的灵魂在于‘峰回路转的变号’，而不仅仅是那平坦的一瞬间。`;

    return `${greeting}\n\n${opening}\n\n${callout}\n\n${modelInsight}\n\n${summary}`;
  }

  if (topic === 'physics') {
    const greeting = isScholarly
      ? '以分析力学动量定理与电磁闭合回路微元积分展开严格推导。'
      : '同学们，电磁感应双棒问题是高考物理压轴常客，咱们用动力学和能量两条主线，把整个物理过程看透！';

    const opening = isRigorous
      ? `### 闭合回路微元动力学与系统动量守恒

设任意时刻两棒速度分别为 $v_1, v_2$ ($v_1 > v_2$)，回路瞬时感应电动势与感应电流为：

$$E(t) = BL(v_1 - v_2), \\quad I(t) = \\frac{BL(v_1 - v_2)}{R_1 + R_2}$$

两棒受到的瞬时安培力大小相等、方向相反：
$$F_A = BIL = \\frac{B^2 L^2 (v_1 - v_2)}{R_1 + R_2}$$

由于水平导轨光滑，两棒构成的系统在水平方向上合外力为零（$\\sum F_{\\text{ext}} = 0$），安培力属于系统内力。对全过程应用**系统动量守恒定律**：

$$m_1 v_0 = (m_1 + m_2) v_{\\infty} \\implies v_{\\infty} = \\frac{m_1}{m_1 + m_2} v_0$$

系统终态相对运动消失（$v_1 = v_2 = v_{\\infty}$），感应电动势 $E = 0$，电流归零，双棒以此稳态速度做终身匀速直线运动。`
      : `### 物理图像直观引导：非接触式磁性离合器

我们可以把磁场中的双棒形象地看成一个‘磁性联轴器’：
- 前棒以 $v_0$ 飞出，在匀强磁场中切割磁感线，化身为一个‘运动的小发电机’；
- 感应电流瞬间流过静止的后棒，使后棒化身为一个‘安培力电动机’，被推着加速往前跑；
- 前棒受到反向安培力被阻碍减速，后棒被推着加速，直到两者的速度完全拉平；
- 一旦两棒速度相同，相对切割立刻停止，回路电流熄灭，两棒像紧扣的齿轮一样并排匀速滑行。`;

    const callout = isExamTraps
      ? `> [!IMPORTANT]
> **🎯 高考压轴高频失分警示：焦耳热分配的“正比”与“反比”误区**
> 
> 很多同学误以为焦耳热公式是 $Q = \\frac{U^2}{R} t$ 从而得出“焦耳热与电阻成反比”的荒谬结论！
> 
> 1. **回路拓扑判据**：在这个闭合单回路中，两棒是**标准单串联回路**！在任意瞬时 $t$，流经两根棒的电流 $I(t)$ 处处绝对相等！
> 2. **精确焦耳热积分**：
>    $$Q_1 = \\int_0^\\infty I^2(t) R_1 \\, \\mathrm{d}t, \\quad Q_2 = \\int_0^\\infty I^2(t) R_2 \\, \\mathrm{d}t \\implies \\frac{Q_1}{Q_2} = \\frac{R_1}{R_2}$$
>    焦耳热分配严格与各自电阻成**正比**，谁的电阻大，谁产热就多！
> 3. **动量守恒适用边界**：若导轨非光滑且两棒质量不等，摩擦力导致的合外力不为零，动量守恒被破坏，必须用动量定理微元求和 $\\int F \\, \\mathrm{d}t$ 联立求解！`
      : `> [!NOTE]
> **✦ 苏格拉底物理直觉追问：能量到底流向了哪里？**
> 
> 亲爱的同学，请深吸一口气，闭上眼睛追踪能量的足迹：
> 
> 初始时刻系统总机械能为 $\\frac{1}{2}m_1 v_0^2$；到了最后终态，系统总机械能变为了 $\\frac{1}{2}(m_1 + m_2) v_{\\infty}^2$。
> 算一算：损失的这部分机械能跑去哪里了？
> 它是如何在没有机械碰撞的情况下，通过虚空的磁场转换为金属晶格的热振动的？`;

    const modelInsight = isHighDim
      ? `### 能量守恒定律与内能耗散解析

全过程动能减少量完全转化为回路焦耳内能：

$$Q_{\\text{total}} = \\Delta E_k = \\frac{1}{2} m_1 v_0^2 - \\frac{1}{2}(m_1 + m_2) v_{\\infty}^2 = \\frac{m_1 m_2}{2(m_1 + m_2)} v_0^2$$

两棒内能耗散精确分配解析式为：
$$Q_1 = \\frac{R_1}{R_1 + R_2} Q_{\\text{total}}, \\qquad Q_2 = \\frac{R_2}{R_1 + R_2} Q_{\\text{total}}$$`
      : `### 电磁双棒三步通关要诀

- **一抓相对速度**：求感应电动势 $E = BL \\Delta v$；
- **二抓合外力为零**：全过程系统动量守恒，直接定死最终匀速；
- **三抓能量守恒**：动能亏损全变热，串联电阻按比例瓜分焦耳热！`;

    const summary = isStructured
      ? `### 物理量动态迁移全景表

| 演化阶段 | 感应电流 $I(t)$ | 前棒加速度 $a_1$ | 后棒加速度 $a_2$ | 能量转化核心 |
| :--- | :--- | :--- | :--- | :--- |
| **初始态 ($t=0$)** | 达到峰值 $\\frac{BLv_0}{R_1+R_2}$ | 反向最大减速 | 正向最大加速 | 动能开始转化为电磁能量 |
| **过渡态 ($t>0$)** | 单调指数衰减 | 减速趋势放缓 | 加速趋势放缓 | 焦耳热持续在棒体内累积 |
| **稳态 ($t \\to \\infty$)** | 严格降为 0 | 加速度归 0 | 加速度归 0 | 机械动能损失全量等于 $Q_1+Q_2$ |`
      : `**名师温润结语**：物理模型千变万化，但万变不离其宗。只要牢牢抓住“动量守恒看外力，能量守恒看转化”这两根定海神针，电磁感应大题便如探囊取物。`;

    return `${greeting}\n\n${opening}\n\n${callout}\n\n${modelInsight}\n\n${summary}`;
  }

  // topic === 'chinese'
  const greeting = isScholarly
    ? '从文本细读、辩证逻辑结构与古代汉语语法层析展开深入鉴赏。'
    : '同学们好！让我们一起泛舟元丰五年的赤壁夜江，体悟大文豪苏东坡如何化解人生的大悲与虚无。';

  const opening = isRigorous
    ? `### 辩证本体论的哲学升华逻辑

苏轼借赤壁之景与客人的悲秋之问，构筑了中国文学史上最深邃的辩证哲学三段论：

1. **立论前提 · 现象界之相对之变**：
   “自其变者而观之，则天地曾不能以一瞬。”
   从时间流逝与微观粒子维度看，江水刹那东流，明月每分盈亏，宇宙间无一物不是暂住即逝的客体。
2. **转折推演 · 本体界之绝对不变**：
   “自其不变者而观之，则物与我皆无尽也。”
   从道体永恒与物质循环维度看，逝者如斯而未尝往也，盈虚者如彼而卒莫消长也。江水与月亮从未真正灭失，人作为自然的一部分亦永在天地之间。
3. **推导结论 · 超然物外的生命解脱**：
   “且夫天地之间，物各有主……惟江上之清风，与山间之明月……取之无禁，用之不竭，是造物者之无尽藏也，而吾与子之所共适。”
   苏轼由此彻底超越了客人的感伤，达至精神与造化同游的最高自由境。`
    : `### 诗意心境唤醒：夜舟主客的情绪戏剧

同学们，试想那是一个怎样的秋夜：
苏子与客在赤壁下泛舟，清风徐来，水波不兴。
客人的洞箫吹得呜呜咽咽，如怨如慕，如泣如诉，整个小舟沉浸在‘寄蜉蝣于天地，渺沧海之一粟’的巨大悲哀与无力感中。

就在这悲伤到达顶点的时刻，苏轼突然伸手指向眼前的浩荡江水和天上皎洁的明月：
**“客亦知夫水与月乎？”**
这一问，就像浓重黑夜里劈开的一道闪电，瞬间把所有人的心胸从狭隘的个人感伤中，拔高到了浩瀚无垠的宇宙洪荒！`;

  const callout = isExamTraps
    ? `> [!IMPORTANT]
> **🎯 高考文言虚词与现代思辨写作迁移**
> 
> 1. **虚词“之”的语法功能递进**：
>    - “自其变者而观**之**”：代词，代指“天地万物之变态”，充当动词“观”的宾语；
>    - “物与我皆无尽**也**”过渡到“苟非吾**之**所有”：助词“之”，用在主谓之间，取消句子独立性，强化客观理性界限；
>    - “是造物者**之**无尽藏也”：结构助词“的”，修饰限定词。
> 2. **虚词“其”的情感语气投射**：
>    - “**其**声呜呜然”：代词，指箫声；
>    - “自**其**变者而观之”：指示代词，相当于“那”，引导哲学思辨视角的转换。
> 3. **高考议论文思辨写作提炼**：
>    学习苏轼“在无常中体悟永恒，在困顿中拥抱清风”的立意维度，在高考命题探讨“得与失、变与恒、快与慢”时，引用此段辩证逻辑，可瞬间让文章立意突破平庸！`
    : `> [!NOTE]
> **✦ 思辨反问研习：东坡的“无尽”是科学还是释怀？**
> 
> 同学们，请思考苏轼所说的“物与我皆无尽也”：
> 这究竟是类似现代物理学的物质不灭与能量守恒，还是他在被贬黄州、政治生命坠入谷底时，为自己灵魂搭建的一座坚不可摧的精神避风港？
> 
> 当你遇到人生考场或生活的逆境挫折时，你更愿意从“变”的角度鞭策自己争分夺秒，还是从“不变”的角度包容释怀？`;

  const modelInsight = isHighDim
    ? `### 文本结构张力图式分析

\`\`\`
【主客问答三元结构】
客之悲哀（局限视角）  ──>  哀吾生之须臾，羡长江之无穷 (感性执念，困于形骸)
        ↓
苏之启悟（辩证视角）  ──>  盖将自其变者而观之 / 自其不变者而观之 (理性超脱，立于天道)
        ↓
终极合一（旷达践行）  ──>  客喜而笑，洗盏更酌，不知东方之既白 (心神两忘，行于当下)
\`\`\``
    : `### 经典文言鉴赏四步法

- **一抓意象**：赤壁、明月、长江、清风；
- **二明对位**：客之悲（哀须臾）对苏之喜（共适造化）；
- **三品虚词**：观“之”之转换，析“其”之音律；
- **四悟哲理**：变中见恒，有限中筑永恒！`;

  const summary = isStructured
    ? `### 虚词释义与哲思结构对照

| 文言虚词 | 语境例句 | 语法作用 | 思辨美学功能 |
| :--- | :--- | :--- | :--- |
| **之** (代词) | 自其变者而观之 | 宾语指代变化之态 | 引出客观冷静的观照视角 |
| **之** (取消独立性) | 苟非吾之所有 | 主谓之间定语化 | 斩断占有欲，树立淡泊界限 |
| **其** (指示代词) | 自其不变者而观之 | 指示“那一侧面” | 驱动思维从现象向本质跃迁 |
| **其** (推测语气) | 其必曰：“先天下之忧而忧” | 副词语气舒缓 | 增强主客探究与叩问的韵味 |`
    : `**名师温润结语**：读《赤壁赋》，不仅是背诵高考文言字词，更是学习东坡先生那种在人生暴风雨中怡然自得的生命定力。愿你们在漫长考学与人生之路上，亦能拥有清风明月般的豁达心胸。`;

  return `${greeting}\n\n${opening}\n\n${callout}\n\n${modelInsight}\n\n${summary}`;
}

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const [demoState, setDemoState] = useState<'idle' | 'speaking'>('idle');
  const [caption, setCaption] = useState('');
  const [forceUnmute, setForceUnmute] = useState(false);
  const [interactiveScores, setInteractiveScores] = useState({
    style: 0.94,
    personality: 0.88,
    strengths: 0.96,
    method: 0.92,
    communication: 0.86,
  });

  const [selectedDemoTopic, setSelectedDemoTopic] = useState<DemoTopicKey>('math');
  const [customQuestion, setCustomQuestion] = useState(DEMO_TOPICS.math.question);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState('');

  const liveAnswerMarkdown = useMemo(
    () => generateLiveAnswer(selectedDemoTopic, interactiveScores),
    [selectedDemoTopic, interactiveScores]
  );

  const archetypeTitle = useMemo(() => {
    const isRigorous = interactiveScores.style >= 0.82;
    const isExamTraps = interactiveScores.method >= 0.82;
    if (isRigorous && isExamTraps) return '公理严密 · 高考压轴领航名师';
    if (!isRigorous && !isExamTraps) return '苏格拉底 · 几何直观启发导师';
    if (isRigorous && !isExamTraps) return '公理化探究 · 递进思辨名师';
    return '数形结合 · 压轴变式建模名师';
  }, [interactiveScores.style, interactiveScores.method]);

  const currentTopicData = DEMO_TOPICS[selectedDemoTopic];

  const handleSelectTopic = (key: DemoTopicKey) => {
    setSelectedDemoTopic(key);
    setCustomQuestion(DEMO_TOPICS[key].question);
    setStreamedAnswer('');
  };

  const handleRunLLM = async () => {
    const q = customQuestion.trim();
    if (!q || isStreaming) return;

    setIsStreaming(true);
    setStreamedAnswer('');

    const synthRecipe = {
      name: `五维自适应名师 (${currentTopicData.label})`,
      title: '特级教学基因定制专家',
      subject: currentTopicData.label,
      style: interactiveScores.style > 0.82 ? '公理化严密推演型' : '苏格拉底启发引导型',
      method: interactiveScores.method > 0.82 ? '典型高考压轴变式剖析' : '问题驱动递进式探究',
      strengths: interactiveScores.strengths > 0.82 ? '数形结合与高维模型综合建构' : '核心法则化简速通',
      personality: interactiveScores.personality > 0.82 ? '学者型沉稳深邃' : '亲切润物细无声',
      communication: interactiveScores.communication > 0.82 ? '纲举目张高密精炼' : '循序渐进细节剖析',
      dim_scores: { ...interactiveScores },
      initialQuestion: q,
    };

    let answerAccumulator = '';
    await teachersApi.streamChat(
      'synth',
      [{ role: 'user', content: q }],
      synthRecipe,
      (delta) => {
        answerAccumulator += delta;
        setStreamedAnswer(answerAccumulator);
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        console.error(err);
        setIsStreaming(false);
      }
    );
  };

  const handleTakeToChat = () => {
    const synthRecipe = {
      name: `五维自适应名师 (${currentTopicData.label})`,
      title: '特级教学基因定制专家',
      subject: currentTopicData.label,
      style: interactiveScores.style > 0.82 ? '公理化严密推演型' : '苏格拉底启发引导型',
      method: interactiveScores.method > 0.82 ? '典型高考压轴变式剖析' : '问题驱动递进式探究',
      strengths: interactiveScores.strengths > 0.82 ? '数形结合与高维模型综合建构' : '核心法则化简速通',
      personality: interactiveScores.personality > 0.82 ? '学者型沉稳深邃' : '亲切润物细无声',
      communication: interactiveScores.communication > 0.82 ? '纲举目张高密精炼' : '循序渐进细节剖析',
      dim_scores: { ...interactiveScores },
      initialQuestion: customQuestion.trim() || currentTopicData.question,
    };
    onNavigate('chat', { synthRecipe });
  };

  const heroContainerRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Timeline & Dynamic Counters
  useHeroEntrance(heroContainerRef);
  const countTeachers = useCountUp(17, 1.5);
  const countDimensions = useCountUp(5, 1.2);
  const countDataSecurity = useCountUp(100, 1.6);

  const handleTryAudio = () => {
    // 停止任何合成语音，直接开启 MP4 视频原声播放与字幕协同
    speechService.stop();
    const transcriptText = "《德意志意识形态》是唯物史观第一次被完整、系统地写出来的著作。这节课沿着原著原文，把核心原理拆开，再对照当代实践。";
    setCaption(transcriptText);
    setDemoState('speaking');
    setForceUnmute(true);
  };

  const featureCards = [
    {
      title: '名师智库 · 五维全息画像',
      desc: '解构特级名师风格、思维、题型等五大教学基因，支持动态五维全息透视。',
      Icon: GraduationCapIcon,
      actionText: '进入名师智库',
      tab: 'library',
      tag: '17+ 权威名师',
      accentColor: 'var(--accent-primary)',
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, transparent 60%)'
    },
    {
      title: '1对1 伴学 · 4K 数字人协作',
      desc: '拟真数字人与智能板书毫秒协同，支持 LaTeX 复杂公式推演与启发式答疑。',
      Icon: MessageSquareIcon,
      actionText: '发起名师辅导',
      tab: 'chat',
      tag: '毫秒级流式响应',
      accentColor: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
    },
    {
      title: '多维教学基因合成工坊',
      desc: '自由萃取名师特长并按学情组合，自研 Critic 引擎生成专属特级导师。',
      Icon: DnaIcon,
      actionText: '定制专属名师',
      tab: 'compose',
      tag: '自研融合算法',
      accentColor: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 60%)'
    },
    {
      title: '微课视频自动化渲染工坊',
      desc: '一键提炼师生答疑难点为黄金微课脚本，全自动渲染交付高清讲解视频。',
      Icon: VideoCameraIcon,
      actionText: '制作微课视频',
      tab: 'studio',
      tag: '自动化渲染缝合',
      accentColor: '#f59e0b',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 60%)'
    },
  ];

  return (
    <div className="ambient-glow-bg" style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '88px' }}>
      <div className="app-container" ref={heroContainerRef}>
        {/* Hardware-Grade Hero Stage (Linear / Apple Dark Luxury) */}
        <section className="hero-stage-grid">
          {/* 左侧宏大叙事与行动中枢 */}
          <div>
            {/* 精准学术名校级 Kicker */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              marginBottom: '18px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 10px var(--accent-primary-glow)'
              }} />
              <span>ACADEMIC INTELLIGENCE · 特级名师教研体系</span>
            </div>

            <h1 className="brand-display gsap-hero-title" style={{ fontSize: '3.1rem', lineHeight: '1.2', color: 'var(--text-main)', marginBottom: '20px' }}>
              汇聚特级名师教学精粹 <br />
              <span style={{
                background: 'linear-gradient(180deg, var(--text-main) 40%, var(--accent-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                以拟真数字人重构沉浸教育
              </span>
            </h1>

            <p className="gsap-hero-desc" style={{ fontSize: '1.02rem', color: 'var(--text-body)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '560px' }}>
              五维解构教学画像，自由合成专属导师。4K超清多模态协同伴学，享受特级教师深度点拨。
            </p>

            {/* 核心 CTA 按钮组 */}
            <div className="gsap-hero-cta" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => onNavigate('library')}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.94rem' }}
              >
                <span>探索名师智库</span>
                <ArrowRightIcon size={16} />
              </button>
              <button
                onClick={() => onNavigate('compose')}
                className="btn btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.94rem' }}
              >
                <DnaIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>定制专属名师</span>
              </button>
              <button
                onClick={handleTryAudio}
                className="btn btn-ghost"
                style={{ padding: '10px 18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}
                title="试听上传 MP4 中的特级教师真实原声"
              >
                <VolumeIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>试听名师原声</span>
              </button>
            </div>

            {/* GSAP 动态滚屏数字指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginTop: '44px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-glass)'
            }}>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countTeachers}+
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>全学科特级名师库</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countDimensions} <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>维</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>教学基因深度解构</div>
              </div>
              <div className="gsap-hero-stat">
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                  {countDataSecurity}<span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>学情数据专有沉淀</div>
              </div>
            </div>
          </div>

          {/* 右侧旗舰级数字人演播室展台 */}
          <div className="gsap-hero-stage">
            <TeacherDigitalHuman
              teacherName="王崇林 (特级教师)"
              subtitle="全国竞赛金牌导师 · 启发式逻辑推演"
              avatarState={demoState}
              captionText={caption}
              forceUnmute={forceUnmute}
              modelVideoUrl="./demo_videos/merged.mp4"
              posterUrl="./demo_videos/merged_poster.jpg"
              onToggleVoice={() => {
                if (demoState === 'speaking' || forceUnmute) {
                  speechService.stop();
                  setDemoState('idle');
                  setForceUnmute(false);
                  setCaption('');
                } else {
                  handleTryAudio();
                }
              }}
            />
          </div>
        </section>

        {/* 核心业务功能矩阵 */}
        <section style={{ marginTop: '72px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              SYSTEM CAPABILITIES
            </div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              全流程教学业务闭环
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              从名师智库解构、1对1伴学，到智能多维合成与微课视频输出
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {featureCards.map(c => {
              const CardIcon = c.Icon;
              return (
                <div
                  key={c.tab}
                  className="card-impeccable"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--card-bg)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: c.accentColor
                    }}>
                      <CardIcon size={22} />
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{c.tag}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                    {c.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: '1.65', marginBottom: '28px', flex: 1 }}>
                    {c.desc}
                  </p>
                  <button
                    onClick={() => onNavigate(c.tab)}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.86rem', justifyContent: 'space-between', padding: '9px 18px' }}
                  >
                    <span>{c.actionText}</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 交互式五维能力雷达试验台 (紧凑型) */}
        <section style={{
          marginTop: '36px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 32px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '36px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <SlidersIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '1.45rem', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em', fontWeight: 800 }}>
                  五维教学基因调优试验台
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
                滑动参数调节教学基因，右侧科技雷达图即刻重塑，演练台实时联动验证：
              </p>

              {/* 交互滑块组 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {[
                  { key: 'style', label: '上课风格', sub: '启发式引导 ↔ 严密公理推演' },
                  { key: 'method', label: '教学方法', sub: '苏格拉底追问 ↔ 高考压轴陷阱' },
                  { key: 'strengths', label: '核心特长', sub: '化简速通 ↔ 数形结合高维建模' },
                  { key: 'personality', label: '互动温度', sub: '亲切幽默鼓励 ↔ 沉稳学术严谨' },
                  { key: 'communication', label: '表达节奏', sub: '循序铺垫剖析 ↔ 纲举目张精炼' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    <div style={{ width: '210px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.sub}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={Math.round((interactiveScores as any)[item.key] * 100)}
                      onChange={e => {
                        const val = Number(e.target.value) / 100;
                        setInteractiveScores(prev => ({ ...prev, [item.key]: val }));
                      }}
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', width: '38px', textAlign: 'right' }} className="tabular-nums">
                      {Math.round((interactiveScores as any)[item.key] * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：升级版科技感五维雷达图 + 基因称号与勋章 */}
            <div style={{
              background: 'var(--bg-glass-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-glass)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <RadarChart5D
                scores={interactiveScores}
                size={185}
                showLabels={true}
                highlightColor="var(--accent-primary)"
              />

              {/* 动态基因称号与勋章 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.04em',
                  background: 'rgba(37, 99, 235, 0.1)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <SparklesIcon size={12} />
                  <span>{archetypeTitle}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--card-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                  }}>
                    ⚡ {interactiveScores.style >= 0.82 ? '公理严密' : '直观隐喻'}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--card-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                  }}>
                    ⚡ {interactiveScores.method >= 0.82 ? '压轴避坑' : '递进启发'}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--card-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                  }}>
                    ⚡ {interactiveScores.strengths >= 0.82 ? '高维建模' : '速通口诀'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 名师答疑演练工作台 (独立大视窗工作台) */}
        <section style={{
          marginTop: '20px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          {/* 顶栏：标题、状态与学科快捷真题 Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquareIcon size={17} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  名师答疑演练工作台
                </h3>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: isStreaming
                  ? 'rgba(245, 158, 11, 0.15)'
                  : (streamedAnswer ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-glass-active)'),
                color: isStreaming
                  ? '#d97706'
                  : (streamedAnswer ? '#059669' : 'var(--text-muted)'),
                border: '1px solid var(--border-glass)',
              }}>
                {isStreaming ? '⚡ 正在调用大模型生成...' : (streamedAnswer ? '✅ 大模型自适应生成就绪' : '✦ 教学基因实时联动')}
              </span>
            </div>

            {/* 学科快捷真题 Tabs */}
            <div style={{
              display: 'inline-flex',
              background: 'var(--bg-glass-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-glass)',
              gap: '4px',
            }}>
              {(['math', 'physics', 'chinese'] as DemoTopicKey[]).map(tKey => {
                const item = DEMO_TOPICS[tKey];
                const isSelected = selectedDemoTopic === tKey;
                const IconComp = item.Icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTopic(item.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <IconComp size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 演练题目大输入控制台 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--bg-glass-subtle)',
            padding: '16px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                <SearchIcon size={15} style={{ color: 'var(--accent-primary)' }} />
                <span>演练题目（支持直接编辑或输入任意学术大题）：</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                按 Enter 或点击下方按钮调用 LLM
              </span>
            </div>

            <textarea
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRunLLM();
                }
              }}
              rows={2}
              placeholder="输入你想测试的高考难点或学术问题（如：为什么驻点不一定是极值点？并举反例说明）..."
              style={{
                width: '100%',
                minHeight: '68px',
                padding: '10px 14px',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            {/* 操作条 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <SparklesIcon size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>微调上方滑块后，点击“真实调用 LLM 生成”即可见证回答风格与推演逻辑的实时变化。</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {streamedAnswer && (
                  <button
                    onClick={() => setStreamedAnswer('')}
                    title="切回预设经典解析"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-glass)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    切回预设
                  </button>
                )}

                <button
                  onClick={handleRunLLM}
                  disabled={isStreaming}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: isStreaming ? 'not-allowed' : 'pointer',
                    opacity: isStreaming ? 0.7 : 1,
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.28)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SparklesIcon size={15} />
                  <span>{isStreaming ? '正在生成...' : '真实调用 LLM 生成'}</span>
                </button>

                <button
                  onClick={handleTakeToChat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>带入 1对1 课堂</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 宽敞明亮的板书答疑视窗 */}
          <div style={{
            background: 'var(--bg-glass-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-glass)',
            padding: '24px 28px',
            minHeight: '340px',
            maxHeight: '520px',
            overflowY: 'auto',
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.04)',
          }}>
            {isStreaming && !streamedAnswer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', fontSize: '0.92rem', padding: '40px 10px', justifyContent: 'center' }}>
                <SparklesIcon size={20} className="animate-spin" />
                <span>特级名师正在依据当前五维教学基因实时推演板书解析...</span>
              </div>
            ) : (
              <RichMarkdown content={streamedAnswer || liveAnswerMarkdown} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
