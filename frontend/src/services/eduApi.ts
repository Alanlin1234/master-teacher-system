import { DEFAULT_DIAGNOSIS } from './learnerStore';

async function eduFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const resp = await fetch(`/edu-api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return (await resp.json()) as T;
  } catch (err) {
    // If backend is unreachable (e.g. GitHub Pages or offline), return graceful mock data
    return getFallbackData<T>(path, options);
  }
}

function getFallbackData<T>(path: string, options: RequestInit): T {
  if (path.includes('/api/monitor/sessions')) {
    return {
      sessions: [
        {
          session_id: 'session-2026-0926-01',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          attention_data: [
            { time: '09:00', score: 85 },
            { time: '09:15', score: 88 },
            { time: '09:30', score: 72 },
            { time: '09:45', score: 91 },
            { time: '10:00', score: 86 },
            { time: '10:15', score: 68 },
            { time: '10:30', score: 94 },
          ],
        },
      ],
    } as unknown as T;
  }

  if (path.includes('/api/monitor/dashboard')) {
    return {
      stats: {
        focus_seconds_today: 4860, // 81 mins
        avg_focus_score: 87.5,
        goal_progress: 88,
        interruptions: { focused: 142, distracted: 12, tired: 8, absent: 4, samples: 166 },
      },
    } as unknown as T;
  }

  if (path.includes('/api/reports/perception-dashboard')) {
    const isWeek = path.includes('period=week');
    const isMonth = path.includes('period=month');
    const attentionSeries = isToday(path)
      ? [
          { time: '08:00', score: 82, status: 'focused' },
          { time: '09:00', score: 88, status: 'focused' },
          { time: '10:00', score: 76, status: 'focused' },
          { time: '11:00', score: 65, status: 'distracted' },
          { time: '14:00', score: 85, status: 'focused' },
          { time: '15:00', score: 92, status: 'focused' },
          { time: '16:00', score: 89, status: 'focused' },
          { time: '17:00', score: 78, status: 'tired' },
          { time: '18:00', score: 91, status: 'focused' },
        ]
      : isWeek
      ? [
          { time: '周一', score: 84, status: 'focused' },
          { time: '周二', score: 89, status: 'focused' },
          { time: '周三', score: 76, status: 'focused' },
          { time: '周四', score: 92, status: 'focused' },
          { time: '周五', score: 81, status: 'distracted' },
          { time: '周六', score: 95, status: 'focused' },
          { time: '周日', score: 90, status: 'focused' },
        ]
      : [
          { time: '第1周', score: 82, status: 'focused' },
          { time: '第2周', score: 86, status: 'focused' },
          { time: '第3周', score: 89, status: 'focused' },
          { time: '第4周', score: 93, status: 'focused' },
        ];

    return {
      period: isWeek ? 'week' : isMonth ? 'month' : 'today',
      sessions: {
        recent_count: isWeek ? 18 : isMonth ? 64 : 5,
        total_hours: isWeek ? 24.5 : isMonth ? 96.2 : 4.8,
        avg_focus: 87.5,
      },
      attention_curve: attentionSeries,
      behavior_stats: [
        { label: '专注均值', value: 87.5, unit: '%', trend: 'up' },
        { label: '周学习频次', value: isWeek ? 18 : 64, unit: '次', trend: 'up' },
        { label: '累计有效时长', value: isWeek ? 24.5 : 96.2, unit: '小时', trend: 'stable' },
      ],
      state_distribution: {
        focused: 82,
        distracted: 11,
        tired: 7,
      },
    } as unknown as T;
  }

  if (path.includes('/api/analysis/analyze')) {
    return {
      summary: '针对导数与极值点偏移压轴题，能够熟练写出一阶导数与切线斜率方程，但在隐零点代换与对数均值不等式放缩时出现思维受阻。',
      difficulties: [
        '极值点偏移中构造对称差函数 F(x) = f(x) - f(2x₀ - x) 的单调性判定受阻',
        '指数放缩 e^x ≥ x + 1 与对数放缩 ln(x) ≤ x - 1 的相切等号临界点讨论不完整',
        '二次求导判别符号变化时计算量过载导致失分',
      ],
      recommendations: [
        '名师采用苏格拉底递进反问法，引导逐步写出导数零点放缩步骤',
        '结合几何画板动态展示切线放缩的临界状态，强化数形结合直观直觉',
      ],
      weak_knowledge: ['极值点偏移与对数均值不等式', '函数零点存在性与切线放缩'],
    } as unknown as T;
  }

  if (path.includes('/api/cognitive/diagnose')) {
    return {
      knowledge_mastery: DEFAULT_DIAGNOSIS.knowledgeMastery,
      ability: {
        theta: DEFAULT_DIAGNOSIS.theta,
        level: DEFAULT_DIAGNOSIS.abilityLevel,
        confidence: DEFAULT_DIAGNOSIS.confidence,
        strengths: ['空间向量几何计算', '线性回归与相关系数', '正态分布曲线与三西格玛'],
        weaknesses: DEFAULT_DIAGNOSIS.weakKnowledge,
      },
      error_patterns: DEFAULT_DIAGNOSIS.errorPatterns,
      recommendations: DEFAULT_DIAGNOSIS.recommendations,
      mastered_count: DEFAULT_DIAGNOSIS.masteredCount,
      weak_count: DEFAULT_DIAGNOSIS.weakCount,
      weak_knowledge: DEFAULT_DIAGNOSIS.weakKnowledge,
      subject: '数学',
      diagnosed_at: new Date().toISOString(),
      insufficient_data: false,
    } as unknown as T;
  }

  return {} as T;
}

function isToday(path: string): boolean {
  return path.includes('period=today') || (!path.includes('period=week') && !path.includes('period=month'));
}

export interface EduUser {
  id: number;
  username: string;
  role: string;
  portal_role?: string;
}

export const eduUsersApi = {
  list: (adminUserId: number) =>
    eduFetch<{ users: EduUser[] }>(`/api/admin/users?admin_user_id=${adminUserId}`),
};

export const monitorApi = {
  analyzeFrame: (_base64Image: string, _actorUserId: number) =>
    Promise.resolve({
      hasTarget: true,
      status: 'focused',
      score: 89,
      detail: '实时面部追踪锁定，目光聚焦于推导草稿，微表情专注。',
    }),

  getSessions: (actorUserId: number, userId?: number) => {
    const p = new URLSearchParams();
    p.set('actor_user_id', String(actorUserId));
    if (userId != null && userId > 0) p.set('user_id', String(userId));
    p.set('limit', '20');
    return eduFetch<{ sessions: Array<{ session_id?: string; attention_data?: Array<{ score?: number | null; time?: string }> }> }>(
      `/api/monitor/sessions?${p.toString()}`
    );
  },

  getDashboard: (actorUserId: number, userId?: number) => {
    const p = new URLSearchParams();
    p.set('actor_user_id', String(actorUserId));
    if (userId != null && userId > 0) p.set('user_id', String(userId));
    return eduFetch<{
      stats: {
        focus_seconds_today: number;
        avg_focus_score: number;
        goal_progress: number;
        interruptions: { focused: number; distracted: number; tired: number; absent: number; samples: number };
      };
    }>(`/api/monitor/dashboard?${p.toString()}`);
  },
};

export const reportsApi = {
  getPerceptionDashboard: (actorUserId: number, period: string, userId?: number) => {
    const p = new URLSearchParams();
    p.set('actor_user_id', String(actorUserId));
    p.set('period', period);
    if (userId != null && userId > 0) p.set('user_id', String(userId));
    return eduFetch<Record<string, unknown>>(`/api/reports/perception-dashboard?${p.toString()}`);
  },
};

export const analysisApi = {
  analyze: (data: { learning_content?: string; difficulties?: string; user_id?: number }) =>
    eduFetch<{
      summary: string;
      difficulties: string[];
      recommendations: string[];
      weak_knowledge: string[];
    }>('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const cognitiveApi = {
  fullDiagnosis: (userId: number, subject: string, grade: string) =>
    eduFetch<{
      knowledge_mastery: Record<string, number>;
      ability: {
        theta: number;
        level: string;
        confidence: number;
        strengths: string[];
        weaknesses: string[];
      };
      error_patterns: Array<{ pattern: string; frequency: string; cause: string }>;
      recommendations: Array<{ type: string; content: string; priority: string }>;
      mastered_count: number;
      weak_count: number;
      weak_knowledge: string[];
      subject: string;
      diagnosed_at: string;
      insufficient_data?: boolean;
    }>('/api/cognitive/diagnose', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, subject, grade }),
    }),
};
