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

export function getLearnerId(): number | null {
  const raw = localStorage.getItem(LEARNER_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getLearnerName(): string {
  return localStorage.getItem(LEARNER_NAME_KEY) || '';
}

export function setLearner(id: number, name: string) {
  localStorage.setItem(LEARNER_KEY, String(id));
  localStorage.setItem(LEARNER_NAME_KEY, name);
}

export function readDiagnosis(): StoredDiagnosis | null {
  const raw = localStorage.getItem(DIAGNOSIS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredDiagnosis;
  } catch {
    return null;
  }
}

export function writeDiagnosis(value: StoredDiagnosis) {
  localStorage.setItem(DIAGNOSIS_KEY, JSON.stringify(value));
}
