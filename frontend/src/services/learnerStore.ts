const LEARNER_KEY = 'edu_learner_id';
const LEARNER_NAME_KEY = 'edu_learner_name';
const DIAGNOSIS_KEY = 'edu_last_diagnosis';

export interface StoredDiagnosis {
  subject: string;
  diagnosedAt: string;
  knowledgeMastery: Record<string, number>;
  weakKnowledge: string[];
  masteredCount: number;
  weakCount: number;
  abilityLevel: string;
  theta: number;
  confidence: number;
  errorPatterns: Array<{ pattern: string; frequency: string; cause: string }>;
  recommendations: Array<{ type: string; content: string; priority: string }>;
}

const DEFAULT_MASTERY: Record<string, number> = {
  '导数的几何意义与切线方程': 0.88,
  '利用导数研究函数单调性': 0.76,
  '极值点偏移与对数均值不等式': 0.38,
  '函数零点存在性与切线放缩': 0.42,
  '椭圆的标准方程与离心率': 0.45,
  '双曲线的渐近线与离心率': 0.72,
  '抛物线的焦点弦与准线性质': 0.81,
  '直线与圆锥曲线的联立弦长': 0.49,
  '空间向量与空间角计算': 0.85,
  '二面角的余弦值求解': 0.78,
  '外接球与内切球体积半径': 0.54,
  '条件概率与全概率公式': 0.82,
  '超几何分布与二项分布': 0.79,
  '正态分布曲线与三西格玛': 0.86,
  '线性回归分析与相关系数': 0.91,
};

export const DEFAULT_DIAGNOSIS: StoredDiagnosis = {
  subject: '数学',
  diagnosedAt: new Date().toISOString(),
  knowledgeMastery: DEFAULT_MASTERY,
  weakKnowledge: ['极值点偏移与对数均值不等式', '函数零点存在性与切线放缩', '椭圆的标准方程与离心率', '直线与圆锥曲线的联立弦长'],
  masteredCount: 9,
  weakCount: 4,
  abilityLevel: 'Level A (前沿冲刺层)',
  theta: 1.42,
  confidence: 0.94,
  errorPatterns: [
    {
      pattern: '构造差函数与对称化构造时缺少自变量定义域讨论',
      frequency: '高频 (4/5次模拟考)',
      cause: '对极值点偏移的对数均值不等式放缩边界理解模糊，容易忽略隐零点代换',
    },
    {
      pattern: '圆锥曲线联立韦达定理在非对称式展开时运算超载',
      frequency: '中频 (2/3次周测)',
      cause: '未熟练使用点差法与参数方程斜率代换，硬算判别式与弦长导致失误',
    },
  ],
  recommendations: [
    {
      type: 'pedagogy',
      content: '采用苏格拉底递进反问法，引导学生自行写出对称化构造 $F(x) = f(x) - f(2x_0 - x)$ 的单调性。',
      priority: '高优先级',
    },
    {
      type: 'visualization',
      content: '结合几何画板动态展示切线放缩 $e^x \\ge x + 1$ 的相切临界状态，强化数形结合直观直觉。',
      priority: '高优先级',
    },
  ],
};

export function getLearnerId(): number {
  const raw = localStorage.getItem(LEARNER_KEY);
  const id = raw ? Number(raw) : NaN;
  if (Number.isFinite(id) && id > 0) return id;
  // Default to built-in high school learner 101
  setLearner(101, '林同学 (高三理科冲刺)');
  return 101;
}

export function getLearnerName(): string {
  const name = localStorage.getItem(LEARNER_NAME_KEY);
  if (name) return name;
  return '林同学 (高三理科冲刺)';
}

export function setLearner(id: number, name: string) {
  localStorage.setItem(LEARNER_KEY, String(id));
  localStorage.setItem(LEARNER_NAME_KEY, name);
}

export function readDiagnosis(): StoredDiagnosis {
  const raw = localStorage.getItem(DIAGNOSIS_KEY);
  if (!raw) {
    writeDiagnosis(DEFAULT_DIAGNOSIS);
    return DEFAULT_DIAGNOSIS;
  }
  try {
    const parsed = JSON.parse(raw) as StoredDiagnosis;
    if (parsed && parsed.knowledgeMastery && Object.keys(parsed.knowledgeMastery).length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_DIAGNOSIS;
}

export function writeDiagnosis(value: StoredDiagnosis) {
  localStorage.setItem(DIAGNOSIS_KEY, JSON.stringify(value));
}
