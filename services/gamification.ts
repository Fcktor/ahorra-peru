// services/gamification.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { ACTION_KEYS, computeBestStreak } from '@/lib/gamification';

export interface AwardResult {
  xpGained: number;
  duplicate: boolean;
  newAchievements: string[];
}

export async function awardXP(
  userId: string,
  actionKey: string,
  xpAmount: number,
  opts: { dedupeKey?: string; metadata?: Record<string, unknown> } = {},
): Promise<AwardResult> {
  const { error: insertError } = await supabase.from('xp_events').insert({
    user_id: userId,
    action_key: actionKey,
    xp_amount: xpAmount,
    dedupe_key: opts.dedupeKey ?? null,
    metadata: opts.metadata ?? {},
  });

  if (insertError) {
    if (insertError.code === '23505') return { xpGained: 0, duplicate: true, newAchievements: [] };
    throw insertError;
  }

  if (xpAmount > 0) {
    const { data: profile } = await supabase.from('profiles').select('xp_total').eq('id', userId).single();
    const newTotal = (profile?.xp_total ?? 0) + xpAmount;
    await supabase.from('profiles').update({ xp_total: newTotal }).eq('id', userId);
  }

  const newAchievements = await checkAndUnlockAchievements(userId);
  return { xpGained: xpAmount, duplicate: false, newAchievements };
}

async function fetchUnlockedAchievementKeys(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('user_achievements').select('achievement_key').eq('user_id', userId);
  return new Set((data ?? []).map((r: { achievement_key: string }) => r.achievement_key));
}

export async function getStatementMonthStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('bank_statement_analyses')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!data || data.length === 0) return 0;

  const months = Array.from(new Set(data.map((r: { created_at: string }) => r.created_at.slice(0, 7))))
    .sort()
    .reverse();

  let streak = 1;
  for (let i = 0; i < months.length - 1; i++) {
    const [y, m] = months[i].split('-').map(Number);
    const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    if (months[i + 1] === prevMonth) streak++;
    else break;
  }
  return streak;
}

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const unlocked = await fetchUnlockedAchievementKeys(userId);
  const newly: string[] = [];

  const maybeUnlock = async (key: string, condition: boolean) => {
    if (unlocked.has(key) || !condition) return;
    const { error } = await supabase.from('user_achievements').insert({ user_id: userId, achievement_key: key });
    if (!error) newly.push(key);
  };

  const { count: quizCorrectCount } = await supabase
    .from('xp_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_key', ACTION_KEYS.QUIZ_CORRECT);
  await maybeUnlock('primeros_pasos', (quizCorrectCount ?? 0) >= 1);

  const { data: quizEvents } = await supabase
    .from('xp_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('action_key', ACTION_KEYS.QUIZ_CORRECT);
  const termCounts: Record<string, number> = {};
  const masteredTerms = new Set<string>();
  (quizEvents ?? []).forEach((e: { metadata: { term?: string } }) => {
    const term = e.metadata?.term;
    if (!term) return;
    termCounts[term] = (termCounts[term] ?? 0) + 1;
    if (termCounts[term] >= 2) masteredTerms.add(term);
  });
  await maybeUnlock('erudito', masteredTerms.size >= 10);

  const { count: comparisonCount } = await supabase
    .from('xp_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_key', ACTION_KEYS.PRODUCT_COMPARED);
  await maybeUnlock('comparador_experto', (comparisonCount ?? 0) >= 10);

  const { count: plansCount } = await supabase
    .from('savings_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  await maybeUnlock('constructor_de_planes', (plansCount ?? 0) >= 1);

  const { count: appliedCount } = await supabase
    .from('xp_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_key', ACTION_KEYS.RECOMMENDATION_APPLIED);
  await maybeUnlock('manos_a_la_obra', (appliedCount ?? 0) >= 5);

  const monthStreak = await getStatementMonthStreak(userId);
  await maybeUnlock('ojo_de_aguila', monthStreak >= 3);

  return newly;
}

export interface GamificationState {
  xpTotal: number;
  achievements: string[];
  recentEvents: { action_key: string; xp_amount: number; created_at: string; metadata: Record<string, unknown> }[];
}

export async function fetchGamificationState(userId: string): Promise<GamificationState> {
  const [{ data: profile }, { data: achievements }, { data: events }] = await Promise.all([
    supabase.from('profiles').select('xp_total').eq('id', userId).single(),
    supabase.from('user_achievements').select('achievement_key').eq('user_id', userId),
    supabase
      .from('xp_events')
      .select('action_key, xp_amount, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    xpTotal: profile?.xp_total ?? 0,
    achievements: (achievements ?? []).map((a: { achievement_key: string }) => a.achievement_key),
    recentEvents: events ?? [],
  };
}

export interface QuizStats {
  totalCorrect: number;
  totalAnswered: number;
  bestStreak: number;
  correctCounts: Record<string, number>;
}

export async function fetchQuizStats(userId: string): Promise<QuizStats> {
  const { data } = await supabase
    .from('xp_events')
    .select('action_key, created_at, metadata')
    .eq('user_id', userId)
    .in('action_key', [ACTION_KEYS.QUIZ_CORRECT, ACTION_KEYS.QUIZ_WRONG])
    .order('created_at', { ascending: true });

  const events = data ?? [];
  const correctCounts: Record<string, number> = {};
  let totalCorrect = 0;
  events.forEach((e: { action_key: string; metadata: { term?: string } }) => {
    if (e.action_key === ACTION_KEYS.QUIZ_CORRECT) {
      totalCorrect++;
      const term = e.metadata?.term;
      if (term) correctCounts[term] = (correctCounts[term] ?? 0) + 1;
    }
  });

  return {
    totalCorrect,
    totalAnswered: events.length,
    bestStreak: computeBestStreak(events),
    correctCounts,
  };
}

const LEGACY_QUIZ_KEY = 'glossary_quiz_progress_v1';

export async function migrateLegacyQuizProgress(userId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(LEGACY_QUIZ_KEY);
  if (!raw) return;
  try {
    const legacy = JSON.parse(raw) as { totalCorrect?: number };
    const xpAmount = (legacy.totalCorrect ?? 0) * 5;
    if (xpAmount > 0) {
      await awardXP(userId, ACTION_KEYS.QUIZ_MIGRATION, xpAmount, {
        dedupeKey: 'quiz_migration',
        metadata: { legacyTotalCorrect: legacy.totalCorrect ?? 0 },
      });
    }
  } finally {
    await AsyncStorage.removeItem(LEGACY_QUIZ_KEY);
  }
}
