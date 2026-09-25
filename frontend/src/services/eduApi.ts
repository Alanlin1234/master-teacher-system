async function eduFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`/edu-api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp.json() as Promise<T>;
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
  analyzeFrame: (base64Image: string, actorUserId: number) =>
    eduFetch<{
      hasTarget: boolean;
      status: string;
      score: number | null;
      detail: string;
    }>('/api/monitor/analyze-frame', {
      method: 'POST',
      body: JSON.stringify({ base64_image: base64Image, actor_user_id: actorUserId }),
    }),

  getSessions: (actorUserId: number, userId?: number) => {
    const p = new URLSearchParams();
    p.set('actor_user_id', String(actorUserId));
    if (userId != null && userId > 0) p.set('user_id', String(userId));
    p.set('limit', '20');
    return eduFetch<{ sessions: Array<{ attention_data?: Array<{ score?: number | null; time?: string }> }> }>(
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
