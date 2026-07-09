// lib/gamification.ts

export const XP_PER_LEVEL_BASE = 150;

export const LEVEL_NAMES = [
  'Ahorrador Novato',
  'Ahorrador Consciente',
  'Ahorrador Estratega',
  'Ahorrador Experto',
  'Maestro del Ahorro',
];

export const ACTION_KEYS = {
  QUIZ_CORRECT: 'quiz_correct',
  QUIZ_WRONG: 'quiz_wrong',
  QUIZ_MIGRATION: 'quiz_migration',
  GLOSSARY_TERM_READ: 'glossary_term_read',
  PRODUCT_COMPARED: 'product_compared',
  CALCULATOR_USED: 'calculator_used',
  PLAN_SAVED: 'plan_saved',
  PLAN_REVIEWED: 'plan_reviewed',
  PRODUCT_FOLLOWED: 'product_followed',
  CARD_VIEWED: 'card_viewed',
  STATEMENT_UPLOADED: 'statement_uploaded',
  STATEMENT_STREAK: 'statement_streak',
  RECOMMENDATION_APPLIED: 'recommendation_applied',
} as const;

export interface LevelInfo {
  level: number;
  name: string;
  xpTotal: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  progress: number;
}

export function levelForXp(xpTotal: number): LevelInfo {
  const safeXp = Math.max(0, xpTotal);
  let level = 1;
  while (safeXp >= level * XP_PER_LEVEL_BASE) level++;

  const xpAtLevelStart = (level - 1) * XP_PER_LEVEL_BASE;
  const xpIntoLevel = safeXp - xpAtLevelStart;
  const nameIndex = Math.min(level - 1, LEVEL_NAMES.length - 1);

  return {
    level,
    name: LEVEL_NAMES[nameIndex],
    xpTotal: safeXp,
    xpIntoLevel,
    xpNeededForLevel: XP_PER_LEVEL_BASE,
    progress: xpIntoLevel / XP_PER_LEVEL_BASE,
  };
}

export interface StreakEvent {
  action_key: string;
  created_at: string;
}

export function computeBestStreak(events: StreakEvent[]): number {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  let best = 0;
  let current = 0;
  for (const e of sorted) {
    if (e.action_key === ACTION_KEYS.QUIZ_CORRECT) {
      current++;
      best = Math.max(best, current);
    } else if (e.action_key === ACTION_KEYS.QUIZ_WRONG) {
      current = 0;
    }
  }
  return best;
}
