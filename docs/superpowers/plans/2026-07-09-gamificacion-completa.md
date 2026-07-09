# Gamificación completa de AhorraPeru — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el sistema de gamificación de AhorraPeru más allá del glosario — motor central de XP/niveles/logros (Supabase) integrado en comparador, calculadora, plan, tasas, tarjetas y estado de cuenta, premiando acciones de cambio de comportamiento financiero real.

**Architecture:** Tabla de eventos `xp_events` (Supabase) + contador cacheado `profiles.xp_total`, servicio central `awardXP()` con deduplicación vía índice único, contexto React `useGamification()` que expone nivel/XP/logros a toda la app, y llamadas puntuales a `award()` en cada pantalla donde ya ocurre una acción real.

**Tech Stack:** Expo 56 + React Native + Expo Router, TypeScript, Supabase (Postgres + Auth + RLS), `@react-native-async-storage/async-storage` (solo para la migración única del progreso legado del quiz).

**Spec:** `docs/superpowers/specs/2026-07-09-gamificacion-completa-design.md`

## Global Constraints

- Package manager: **pnpm** en todos los comandos (`pnpm add`, `pnpm exec`, `pnpm web`) — nunca `npm`/`yarn`.
- **Este repo no tiene framework de tests** (sin jest/vitest, sin archivos `.test.*`, sin `tsx`/`ts-node` instalado — confirmado antes de escribir este plan). No se introduce uno nuevo solo para esta feature. La verificación de cada tarea es:
  1. `pnpm exec tsc --noEmit` debe pasar sin errores (typecheck completo, ya configurado en `tsconfig.json`).
  2. Verificación manual corriendo `pnpm web` y ejercitando el flujo descrito en cada tarea — mismo patrón que el resto del proyecto (ver `estado-cuenta.tsx`, verificado manualmente según memoria del proyecto).
- No hay carpeta `supabase/migrations/` — el patrón establecido en este proyecto es entregar el SQL para que Albert lo corra manualmente en el editor SQL de Supabase (mismo patrón usado para `savings_plans`, `followed_products`, `rate_changes`).
- Todas las pantallas nuevas siguen el patrón visual existente: `Colors` de `constants/colors.ts`, fuentes `Figtree_*`/`Archivo_800ExtraBold`, `StyleSheet.create` al final del archivo.
- Todo lo relacionado a gamificación requiere cuenta (`useAuth().user`) — sin sesión, ninguna pantalla debe intentar leer/escribir `xp_events`.

---

### Task 1: Esquema de base de datos

**Files:**
- Create: `supabase/sql/2026-07-09-gamification.sql`

**Interfaces:**
- Produces: tablas `xp_events(id, user_id, action_key, xp_amount, dedupe_key, metadata, created_at)` y `user_achievements(id, user_id, achievement_key, unlocked_at)`; columna `profiles.xp_total`; columna `bank_statement_analyses.gastos_evitables_aplicados`. Todas las tareas siguientes dependen de este esquema existiendo en Supabase.

- [ ] **Step 1: Escribir el SQL**

```sql
-- supabase/sql/2026-07-09-gamification.sql
-- Correr manualmente en el editor SQL de Supabase (proyecto qdollaysvrlrpbytmbzs).

alter table profiles
  add column if not exists xp_total integer not null default 0;

alter table bank_statement_analyses
  add column if not exists gastos_evitables_aplicados integer[] not null default '{}';

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  xp_amount integer not null default 0,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists xp_events_user_dedupe_idx
  on xp_events(user_id, dedupe_key)
  where dedupe_key is not null;

alter table xp_events enable row level security;

create policy "select own xp_events" on xp_events
  for select using (auth.uid() = user_id);

create policy "insert own xp_events" on xp_events
  for insert with check (auth.uid() = user_id);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_key)
);

alter table user_achievements enable row level security;

create policy "select own achievements" on user_achievements
  for select using (auth.uid() = user_id);

create policy "insert own achievements" on user_achievements
  for insert with check (auth.uid() = user_id);
```

- [ ] **Step 2: Entregar a Albert para correrlo en Supabase**

Este paso no lo ejecuta el agente — Albert debe pegar el contenido de `supabase/sql/2026-07-09-gamification.sql` en el SQL Editor de Supabase (proyecto `qdollaysvrlrpbytmbzs`) y ejecutarlo. Avísale explícitamente con este mensaje antes de continuar a la Task 2:

> "Antes de seguir necesito que corras este SQL en Supabase (SQL Editor → pega el contenido de `supabase/sql/2026-07-09-gamification.sql` → Run). Avísame cuando esté listo."

- [ ] **Step 3: Verificar**

Pide a Albert que confirme, o si tienes acceso al proyecto Supabase, corre en el SQL Editor:

```sql
select column_name from information_schema.columns where table_name = 'profiles' and column_name = 'xp_total';
select table_name from information_schema.tables where table_name in ('xp_events', 'user_achievements');
```

Expected: la primera consulta devuelve una fila (`xp_total`), la segunda devuelve dos filas.

- [ ] **Step 4: Commit**

```bash
git add supabase/sql/2026-07-09-gamification.sql
git commit -m "docs: agrega SQL del esquema de gamificación (xp_events, user_achievements)"
```

---

### Task 2: `lib/gamification.ts` — niveles, claves de acción, cálculo de racha

**Files:**
- Create: `lib/gamification.ts`

**Interfaces:**
- Produces: `ACTION_KEYS` (objeto de constantes de string), `XP_PER_LEVEL_BASE: number`, `LEVEL_NAMES: string[]`, `LevelInfo` interface, `levelForXp(xpTotal: number): LevelInfo`, `StreakEvent` interface, `computeBestStreak(events: StreakEvent[]): number`.
- Consumes: nada (módulo puro, sin dependencias de Supabase ni React Native).

- [ ] **Step 1: Escribir el archivo**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (el archivo no tiene consumidores todavía, así que solo valida que compile).

- [ ] **Step 3: Commit**

```bash
git add lib/gamification.ts
git commit -m "feat: agrega lógica pura de niveles y rachas de gamificación"
```

---

### Task 3: `constants/achievements.ts` — catálogo de logros

**Files:**
- Create: `constants/achievements.ts`

**Interfaces:**
- Produces: `Achievement` interface, `ACHIEVEMENTS: Achievement[]` con las claves `primeros_pasos`, `erudito`, `comparador_experto`, `constructor_de_planes`, `ojo_de_aguila`, `manos_a_la_obra`.

- [ ] **Step 1: Escribir el archivo**

```ts
// constants/achievements.ts

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'primeros_pasos',
    title: 'Primeros pasos',
    description: 'Completa tu primer quiz del glosario',
    icon: '🌱',
  },
  {
    key: 'erudito',
    title: 'Erudito',
    description: 'Domina 20 términos del glosario',
    icon: '📚',
  },
  {
    key: 'comparador_experto',
    title: 'Comparador experto',
    description: 'Compara 10 pares de productos',
    icon: '⚖️',
  },
  {
    key: 'constructor_de_planes',
    title: 'Constructor de planes',
    description: 'Guarda tu primer plan de ahorro',
    icon: '🏗️',
  },
  {
    key: 'ojo_de_aguila',
    title: 'Ojo de águila',
    description: 'Sube tu estado de cuenta 3 meses consecutivos',
    icon: '🦅',
  },
  {
    key: 'manos_a_la_obra',
    title: 'Manos a la obra',
    description: 'Marca 5 recomendaciones como aplicadas',
    icon: '🛠️',
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add constants/achievements.ts
git commit -m "feat: agrega catálogo de logros de gamificación"
```

---

### Task 4: `services/gamification.ts` — motor de XP y logros

**Files:**
- Create: `services/gamification.ts`

**Interfaces:**
- Consumes: `supabase` de `services/supabase.ts`; `ACHIEVEMENTS` de `constants/achievements.ts`; `ACTION_KEYS`, `computeBestStreak` de `lib/gamification.ts`; `AsyncStorage` de `@react-native-async-storage/async-storage`.
- Produces: `AwardResult { xpGained: number; duplicate: boolean; newAchievements: string[] }`, `awardXP(userId: string, actionKey: string, xpAmount: number, opts?: { dedupeKey?: string; metadata?: Record<string, unknown> }): Promise<AwardResult>`, `GamificationState { xpTotal: number; achievements: string[]; recentEvents: {action_key: string; xp_amount: number; created_at: string; metadata: Record<string, unknown>}[] }`, `fetchGamificationState(userId: string): Promise<GamificationState>`, `QuizStats { totalCorrect: number; totalAnswered: number; bestStreak: number; correctCounts: Record<string, number> }`, `fetchQuizStats(userId: string): Promise<QuizStats>`, `getStatementMonthStreak(userId: string): Promise<number>`, `migrateLegacyQuizProgress(userId: string): Promise<void>`.

- [ ] **Step 1: Escribir el archivo**

```ts
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
  await maybeUnlock('erudito', masteredTerms.size >= 20);

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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add services/gamification.ts
git commit -m "feat: agrega servicio central de XP, logros y migración del quiz legado"
```

---

### Task 5: `context/gamification.tsx` — proveedor y hook `useGamification`

**Files:**
- Create: `context/gamification.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `levelForXp`, `LevelInfo` de `lib/gamification.ts`; `awardXP as awardXPService`, `fetchGamificationState`, `migrateLegacyQuizProgress`, `GamificationState` de `services/gamification.ts`; `ACHIEVEMENTS` de `constants/achievements.ts`.
- Produces: `GamificationProvider`, `useGamification(): { xpTotal: number; levelInfo: LevelInfo; achievements: string[]; recentEvents: GamificationState['recentEvents']; toast: {xpGained: number; leveledUp: boolean; newAchievementTitles: string[]} | null; dismissToast: () => void; award: (actionKey: string, xpAmount: number, opts?: {dedupeKey?: string; metadata?: Record<string, unknown>}) => Promise<void>; refresh: () => Promise<void> }`.

- [ ] **Step 1: Escribir el archivo**

```tsx
// context/gamification.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { levelForXp, LevelInfo } from '@/lib/gamification';
import {
  awardXP as awardXPService,
  fetchGamificationState,
  migrateLegacyQuizProgress,
  GamificationState,
} from '@/services/gamification';
import { ACHIEVEMENTS } from '@/constants/achievements';

interface Toast {
  xpGained: number;
  leveledUp: boolean;
  newAchievementTitles: string[];
}

interface GamificationContextType {
  xpTotal: number;
  levelInfo: LevelInfo;
  achievements: string[];
  recentEvents: GamificationState['recentEvents'];
  toast: Toast | null;
  dismissToast: () => void;
  award: (actionKey: string, xpAmount: number, opts?: { dedupeKey?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY_STATE: GamificationState = { xpTotal: 0, achievements: [], recentEvents: [] };

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>(EMPTY_STATE);
  const [toast, setToast] = useState<Toast | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setState(EMPTY_STATE); return; }
    const next = await fetchGamificationState(user.id);
    setState(next);
  }, [user]);

  useEffect(() => {
    if (!user) { setState(EMPTY_STATE); return; }
    migrateLegacyQuizProgress(user.id).then(refresh);
  }, [user, refresh]);

  const award = useCallback(async (
    actionKey: string,
    xpAmount: number,
    opts?: { dedupeKey?: string; metadata?: Record<string, unknown> },
  ) => {
    if (!user) return;
    const prevLevel = levelForXp(state.xpTotal).level;
    const result = await awardXPService(user.id, actionKey, xpAmount, opts);
    if (result.duplicate) return;
    await refresh();
    const newLevel = levelForXp(state.xpTotal + result.xpGained).level;
    if (result.xpGained > 0 || result.newAchievements.length > 0) {
      setToast({
        xpGained: result.xpGained,
        leveledUp: newLevel > prevLevel,
        newAchievementTitles: result.newAchievements.map(
          (k) => ACHIEVEMENTS.find((a) => a.key === k)?.title ?? k,
        ),
      });
    }
  }, [user, state.xpTotal, refresh]);

  return (
    <GamificationContext.Provider
      value={{
        xpTotal: state.xpTotal,
        levelInfo: levelForXp(state.xpTotal),
        achievements: state.achievements,
        recentEvents: state.recentEvents,
        toast,
        dismissToast: () => setToast(null),
        award,
        refresh,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used inside GamificationProvider');
  return ctx;
}
```

- [ ] **Step 2: Wire into `app/_layout.tsx`**

Modify `app/_layout.tsx:1-4` (imports) and `:32-34` / `:100` (provider nesting):

```tsx
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { AuthProvider } from '@/context/auth';
import { GamificationProvider } from '@/context/gamification';
import { Colors } from '@/constants/colors';
import ChatBot from '@/components/ChatBot';
```

```tsx
  return (
    <AuthProvider>
    <GamificationProvider>
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
```

...y cierra el nuevo provider antes del cierre de `AuthProvider` al final del archivo:

```tsx
      <ChatBot />
    </View>
    </GamificationProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`
Expected: la app carga sin pantalla en blanco ni error de "useGamification must be used inside GamificationProvider" en consola (el provider está montado pero todavía no lo consume nadie).

- [ ] **Step 5: Commit**

```bash
git add context/gamification.tsx app/_layout.tsx
git commit -m "feat: agrega GamificationProvider y lo monta en el layout raíz"
```

---

### Task 6: Badge flotante + toast de feedback

**Files:**
- Create: `components/GamificationBadge.tsx`
- Create: `components/XPToast.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `useIsDesktop` de `hooks/useIsDesktop.ts`.
- Produces: `GamificationBadge` (componente, sin props, se auto-oculta si `useIsDesktop()` es `true` o si no hay usuario), `XPToast` (componente, sin props).

- [ ] **Step 1: Escribir `components/GamificationBadge.tsx`**

```tsx
// components/GamificationBadge.tsx
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function GamificationBadge() {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { levelInfo } = useGamification();
  const router = useRouter();

  if (!user || isDesktop) return null;

  return (
    <Pressable style={styles.pill} onPress={() => router.push('/progreso')}>
      <Text style={styles.level}>Nv {levelInfo.level}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 54,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  level: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.primary },
  track: { width: 48, height: 5, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: Colors.primary, borderRadius: 3 },
});
```

- [ ] **Step 2: Escribir `components/XPToast.tsx`**

```tsx
// components/XPToast.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useGamification } from '@/context/gamification';

export default function XPToast() {
  const { toast, dismissToast } = useGamification();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 2600);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <View style={styles.toast} pointerEvents="none">
      {toast.leveledUp && <Text style={styles.title}>¡Subiste de nivel! 🎉</Text>}
      {toast.newAchievementTitles.map((title) => (
        <Text key={title} style={styles.title}>¡Nuevo logro: {title}! 🏅</Text>
      ))}
      {toast.xpGained > 0 && <Text style={styles.xp}>+{toast.xpGained} XP</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 30,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.background },
  xp: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.background, marginTop: 2 },
});
```

- [ ] **Step 3: Montar ambos en `app/_layout.tsx`**

Modify imports (junto a `import ChatBot from '@/components/ChatBot';`):

```tsx
import ChatBot from '@/components/ChatBot';
import GamificationBadge from '@/components/GamificationBadge';
import XPToast from '@/components/XPToast';
```

Modify el final del árbol (junto a `<ChatBot />`):

```tsx
      <ChatBot />
      <GamificationBadge />
      <XPToast />
    </View>
    </GamificationProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `pnpm web`, inicia sesión con una cuenta de prueba.
Expected: aparece un pill "Nv 1" con una barra vacía en la esquina superior derecha (en vista móvil/ventana angosta). Al reducir el ancho de la ventana por debajo de 1024px el pill sigue visible; al ensancharla por encima de 1024px desaparece (porque en desktop vivirá en el sidebar, Task 8). Tocar el pill navega a `/progreso` — dará 404/pantalla en blanco hasta la Task 7, es esperado por ahora.

- [ ] **Step 6: Commit**

```bash
git add components/GamificationBadge.tsx components/XPToast.tsx app/_layout.tsx
git commit -m "feat: agrega badge flotante de nivel y toast de feedback de XP"
```

---

### Task 7: Pantalla `/progreso`

**Files:**
- Create: `app/progreso.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `useGamification` de `context/gamification.tsx`; `ACHIEVEMENTS` de `constants/achievements.ts`.

- [ ] **Step 1: Escribir `app/progreso.tsx`**

```tsx
// app/progreso.tsx
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useGamification } from '@/context/gamification';
import { ACHIEVEMENTS } from '@/constants/achievements';

const ACTION_LABELS: Record<string, string> = {
  quiz_correct: 'Respondiste bien en el quiz',
  quiz_migration: 'Migramos tu progreso anterior del quiz',
  glossary_term_read: 'Leíste un término nuevo',
  product_compared: 'Comparaste dos productos',
  calculator_used: 'Corriste una simulación',
  plan_saved: 'Guardaste un plan de ahorro',
  plan_reviewed: 'Revisaste un plan guardado',
  product_followed: 'Empezaste a seguir un producto',
  card_viewed: 'Revisaste una tarjeta de crédito',
  statement_uploaded: 'Subiste un estado de cuenta',
  statement_streak: 'Constancia mensual con tu estado de cuenta',
  recommendation_applied: 'Aplicaste una recomendación',
};

export default function ProgresoScreen() {
  const router = useRouter();
  const { levelInfo, achievements, recentEvents } = useGamification();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mi Progreso</Text>

        <View style={styles.levelCard}>
          <Text style={styles.levelName}>{levelInfo.name}</Text>
          <Text style={styles.levelNum}>Nivel {levelInfo.level}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
          </View>
          <Text style={styles.xpText}>{levelInfo.xpIntoLevel} / {levelInfo.xpNeededForLevel} XP para el siguiente nivel</Text>
        </View>

        <Text style={styles.sectionTitle}>Logros</Text>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((a) => {
            const unlocked = achievements.includes(a.key);
            return (
              <View key={a.key} style={[styles.achievementCard, !unlocked && styles.achievementLocked]}>
                <Text style={styles.achievementIcon}>{unlocked ? a.icon : '🔒'}</Text>
                <Text style={styles.achievementTitle}>{a.title}</Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activityCard}>
          {recentEvents.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no ganaste puntos. Explora la app para empezar.</Text>
          ) : (
            recentEvents.map((e, i) => (
              <View key={i} style={styles.activityRow}>
                <Text style={styles.activityLabel}>{ACTION_LABELS[e.action_key] ?? e.action_key}</Text>
                {e.xp_amount > 0 && <Text style={styles.activityXp}>+{e.xp_amount} XP</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { fontSize: 20, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  title: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 16 },

  levelCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginBottom: 24,
  },
  levelName: { fontSize: 18, fontFamily: 'Figtree_700Bold', color: Colors.primary },
  levelNum: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  track: { height: 10, borderRadius: 5, backgroundColor: Colors.border, overflow: 'hidden' },
  fill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
  xpText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 8 },

  sectionTitle: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 10 },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  achievementCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  achievementLocked: { opacity: 0.5 },
  achievementIcon: { fontSize: 22, marginBottom: 6 },
  achievementTitle: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  achievementDesc: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 4, lineHeight: 15 },

  activityCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  emptyText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityLabel: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flex: 1 },
  activityXp: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.primary },
});
```

- [ ] **Step 2: Registrar la ruta modal en `app/_layout.tsx`**

Modify `app/_layout.tsx` — agrega junto a los otros `<Stack.Screen name="estado-cuenta" ... />`:

```tsx
        <Stack.Screen
          name="progreso"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, toca el badge flotante de la Task 6.
Expected: se abre `/progreso` como modal mostrando "Ahorrador Novato", "Nivel 1", barra vacía, 6 tarjetas de logros todas bloqueadas (🔒), y "Todavía no ganaste puntos. Explora la app para empezar."

- [ ] **Step 5: Commit**

```bash
git add app/progreso.tsx app/_layout.tsx
git commit -m "feat: agrega pantalla de progreso (nivel, logros, actividad reciente)"
```

---

### Task 8: Nivel/XP en el sidebar de escritorio

**Files:**
- Modify: `components/DesktopSidebar.tsx`

**Interfaces:**
- Consumes: `useGamification` de `context/gamification.tsx`.

- [ ] **Step 1: Agregar el bloque de nivel al sidebar**

Modify `components/DesktopSidebar.tsx:1-7` (imports):

```tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';
```

Modify `components/DesktopSidebar.tsx:18-27` (dentro del componente, agrega el hook):

```tsx
export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isPro, signOut } = useAuth();
  const { levelInfo } = useGamification();
  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);
```

Modify `components/DesktopSidebar.tsx:46-59` (justo antes del bloque `bcrpCard`, agrega el bloque de nivel — solo si hay usuario):

```tsx
      <View style={styles.spacer} />

      {user && (
        <Pressable style={styles.levelCard} onPress={() => router.push('/progreso')}>
          <Text style={styles.levelTitle}>{levelInfo.name.toUpperCase()}</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelValue}>Nivel {levelInfo.level}</Text>
          </View>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
          </View>
        </Pressable>
      )}

      <View style={styles.bcrpCard}>
```

- [ ] **Step 2: Agregar los estilos nuevos**

Modify `components/DesktopSidebar.tsx` — dentro de `StyleSheet.create`, junto a `bcrpCard`:

```ts
  levelCard: {
    backgroundColor: '#1C3128',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  levelTitle: { fontSize: 10, fontFamily: 'Figtree_600SemiBold', color: '#8FA79A', letterSpacing: 1, marginBottom: 6 },
  levelRow: { flexDirection: 'row', marginBottom: 8 },
  levelValue: { fontFamily: 'Archivo_800ExtraBold', fontSize: 14, color: '#F6F4EC' },
  levelTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  levelFill: { height: 6, borderRadius: 3, backgroundColor: '#5BC98A' },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, ensancha la ventana a ≥1024px de ancho, inicia sesión.
Expected: el sidebar oscuro muestra un bloque "AHORRADOR NOVATO" / "Nivel 1" con una barra verde clara vacía, arriba de la tarjeta "BCRP · TIEMPO REAL". Tocarlo navega a `/progreso`. El badge flotante de la Task 6 NO aparece en esta vista (se auto-ocultó por `useIsDesktop()`).

- [ ] **Step 5: Commit**

```bash
git add components/DesktopSidebar.tsx
git commit -m "feat: agrega bloque de nivel/XP al sidebar de escritorio"
```

---

### Task 9: Glosario — quiz migrado a Supabase + login-gate

**Files:**
- Modify: `components/GlossaryQuiz.tsx`
- Modify: `app/(tabs)/glosario.tsx`

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `fetchQuizStats`, `QuizStats` de `services/gamification.ts`; `ACTION_KEYS` de `lib/gamification.ts`.
- Produces: `GlossaryQuiz` ya no depende de `services/quizStorage.ts` (ese archivo queda sin usar tras esta tarea — no lo borres todavía, `migrateLegacyQuizProgress` de la Task 4 sigue leyendo la misma clave de `AsyncStorage`).

- [ ] **Step 1: Reescribir `components/GlossaryQuiz.tsx`**

```tsx
// components/GlossaryQuiz.tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { GLOSSARY, GlossaryTerm } from '@/constants/glossary';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { fetchQuizStats, QuizStats } from '@/services/gamification';
import { ACTION_KEYS } from '@/lib/gamification';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestion(exclude?: string) {
  const pool = exclude ? GLOSSARY.filter((t) => t.term !== exclude) : GLOSSARY;
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(GLOSSARY.filter((t) => t.term !== answer.term)).slice(0, 3);
  const options = shuffle([answer, ...distractors]);
  return { answer, options };
}

const STREAK_MILESTONES: Record<number, string> = {
  3: '¡Racha de 3! 🔥',
  5: '¡Racha de 5! 🔥🔥',
  10: '¡Racha de 10! Eres un crack 🔥🔥🔥',
};

export function GlossaryQuiz() {
  const { user } = useAuth();
  const { award } = useGamification();
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState(() => buildQuestion());
  const [selected, setSelected] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<string | null>(null);

  const loadStats = () => { if (user) fetchQuizStats(user.id).then(setStats); };
  useEffect(() => { loadStats(); }, [user]);

  const masteredCount = useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats.correctCounts).filter((n) => n >= 2).length;
  }, [stats]);

  if (!user || !stats) return null;

  const isCorrect = (term: string) => term === question.answer.term;

  const onAnswer = async (term: GlossaryTerm) => {
    if (selected) return;
    setSelected(term.term);

    const correct = isCorrect(term.term);
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    setMilestone(correct && STREAK_MILESTONES[nextStreak] ? STREAK_MILESTONES[nextStreak] : null);

    if (correct) {
      await award(ACTION_KEYS.QUIZ_CORRECT, 5, { metadata: { term: question.answer.term } });
    } else {
      await award(ACTION_KEYS.QUIZ_WRONG, 0, { metadata: { term: question.answer.term } });
    }
    loadStats();

    setTimeout(() => {
      setQuestion(buildQuestion(question.answer.term));
      setSelected(null);
    }, 1100);
  };

  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Stat label="Racha actual" value={`${streak} 🔥`} />
        <Stat label="Mejor racha" value={`${stats.bestStreak}`} />
        <Stat label="Precisión" value={stats.totalAnswered > 0 ? `${accuracy}%` : '—'} />
      </View>

      <View style={styles.masteryRow}>
        <Text style={styles.masteryLabel}>Términos dominados: {masteredCount}/{GLOSSARY.length}</Text>
        <View style={styles.masteryTrack}>
          <View style={[styles.masteryFill, { width: `${(masteredCount / GLOSSARY.length) * 100}%` }]} />
        </View>
      </View>

      {milestone && (
        <View style={styles.milestoneBanner}>
          <Text style={styles.milestoneText}>{milestone}</Text>
        </View>
      )}

      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>¿Qué término es este?</Text>
        <Text style={styles.questionText}>{question.answer.definition}</Text>
      </View>

      <View style={styles.optionsGrid}>
        {question.options.map((opt) => {
          const showState = selected !== null;
          const correct = isCorrect(opt.term);
          const chosen = selected === opt.term;
          return (
            <TouchableOpacity
              key={opt.term}
              activeOpacity={0.85}
              disabled={showState}
              onPress={() => onAnswer(opt)}
              style={[
                styles.optionButton,
                showState && correct && styles.optionCorrect,
                showState && chosen && !correct && styles.optionWrong,
              ]}
            >
              <Text style={styles.optionText}>{opt.term}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  statLabel: { fontSize: 10, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 2 },

  masteryRow: { marginBottom: 12 },
  masteryLabel: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginBottom: 6 },
  masteryTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  masteryFill: { height: 6, borderRadius: 3, backgroundColor: Colors.accent },

  milestoneBanner: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.primary },

  questionCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
    minHeight: 110,
  },
  questionLabel: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  questionText: { fontSize: 15, fontFamily: 'Figtree_400Regular', color: Colors.textPrimary, lineHeight: 22 },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  optionButton: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  optionCorrect: { backgroundColor: Colors.accent + '25', borderColor: Colors.accent },
  optionWrong: { backgroundColor: Colors.danger + '25', borderColor: Colors.danger },
  optionText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, textAlign: 'center' },
});
```

- [ ] **Step 2: Login-gate en `app/(tabs)/glosario.tsx`**

Modify `app/(tabs)/glosario.tsx:1-16` (imports):

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { GLOSSARY, GlossaryTerm } from '@/constants/glossary';
import { GlossaryQuiz } from '@/components/GlossaryQuiz';
import { useAuth } from '@/context/auth';
```

Modify `app/(tabs)/glosario.tsx:17-20` (agrega router y user al componente):

```tsx
export default function GlosarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<'explorar' | 'quiz'>('explorar');
```

Modify `app/(tabs)/glosario.tsx:65-75` (bloque `if (mode === 'quiz')`):

```tsx
  if (mode === 'quiz') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ScrollView contentContainerStyle={styles.list}>
          {header}
          {user ? (
            <GlossaryQuiz />
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardHint}>Necesitas una cuenta para jugar el quiz y guardar tu progreso.</Text>
              <TouchableOpacity style={styles.cta} onPress={() => router.push('/login')}>
                <Text style={styles.ctaText}>Crear cuenta o iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
```

- [ ] **Step 3: Agregar los estilos `card`/`cardHint`/`cta`/`ctaText` faltantes**

Modify `app/(tabs)/glosario.tsx` — dentro de `StyleSheet.create`, agrega (no existen todavía en este archivo):

```ts
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  cardHint: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 12 },
  cta: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.background },
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `pnpm web`. Sin sesión, ve a Glosario → pestaña "Quiz 🎯" → debe mostrar el CTA de "Crear cuenta o iniciar sesión" en vez del quiz. Inicia sesión, vuelve a Glosario → Quiz → responde una pregunta: debe aparecer el toast "+5 XP" (Task 6), el badge de nivel debe empezar a llenar su barra, y "Racha actual"/"Mejor racha"/"Precisión" deben actualizarse. Si tenías progreso viejo del quiz (localStorage/AsyncStorage) de antes de esta tarea, la primera carga debe migrarlo silenciosamente (revisa `/progreso` → actividad reciente → debería aparecer una fila "Migramos tu progreso anterior del quiz").

- [ ] **Step 6: Commit**

```bash
git add components/GlossaryQuiz.tsx "app/(tabs)/glosario.tsx"
git commit -m "feat: migra el quiz del glosario de AsyncStorage a Supabase con XP"
```

---

### Task 10: Glosario — XP por explorar términos

**Files:**
- Modify: `app/(tabs)/glosario.tsx`

**Interfaces:**
- Consumes: `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar el import y el hook**

Modify `app/(tabs)/glosario.tsx` — junto a `import { useAuth } from '@/context/auth';` (agregado en la Task 9):

```tsx
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
```

Modify el cuerpo del componente:

```tsx
export default function GlosarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { award } = useGamification();
  const [mode, setMode] = useState<'explorar' | 'quiz'>('explorar');
```

- [ ] **Step 2: Otorgar XP al expandir un término por primera vez**

Modify la función `toggle` (`app/(tabs)/glosario.tsx:28`):

```tsx
  const toggle = (term: string) => {
    const next = expanded === term ? null : term;
    setExpanded(next);
    if (next && user) {
      award(ACTION_KEYS.GLOSSARY_TERM_READ, 2, {
        dedupeKey: `glossary_term_read:${term}`,
        metadata: { term },
      });
    }
  };
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, ve a Glosario → "Explorar", toca un término para expandirlo.
Expected: toast "+2 XP". Ciérralo y vuelve a abrirlo: no debe aparecer un segundo toast (deduplicado por término). Abre un término distinto: sí debe dar XP de nuevo.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/glosario.tsx"
git commit -m "feat: otorga XP por explorar términos nuevos del glosario"
```

---

### Task 11: Comparador — XP por comparar un par de productos

**Files:**
- Modify: `app/comparar.tsx`

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar los imports**

Modify `app/comparar.tsx:1-9`:

```tsx
import { useEffect } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
```

- [ ] **Step 2: Otorgar XP al montar la pantalla con un par válido**

Modify `app/comparar.tsx:24-27`:

```tsx
export default function CompararScreen() {
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
  const { user } = useAuth();
  const { award } = useGamification();
  const optA = SAVINGS_OPTIONS.find((o) => o.id === a);
  const optB = SAVINGS_OPTIONS.find((o) => o.id === b);

  useEffect(() => {
    if (!user || !optA || !optB) return;
    const pairKey = [optA.id, optB.id].sort().join(':');
    award(ACTION_KEYS.PRODUCT_COMPARED, 5, { dedupeKey: `product_compared:${pairKey}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, optA?.id, optB?.id]);
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, ve al comparador principal, selecciona 2 productos, toca "Comparar →".
Expected: toast "+5 XP" al llegar a la pantalla de comparación. Vuelve atrás y compara exactamente el mismo par de nuevo: no debe dar XP otra vez. Compara un par distinto: sí debe dar XP.

- [ ] **Step 5: Commit**

```bash
git add app/comparar.tsx
git commit -m "feat: otorga XP por comparar un par nuevo de productos"
```

---

### Task 12: Calculadora — XP por completar una simulación

**Files:**
- Modify: `app/(tabs)/calculadora.tsx`

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar los imports**

Modify `app/(tabs)/calculadora.tsx:1-17`:

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';
import { calcInterest } from '@/lib/interestMath';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
```

- [ ] **Step 2: Otorgar XP una vez por día, por modo, cuando el resultado se vuelve válido**

Modify `app/(tabs)/calculadora.tsx:98-120` (dentro de `CalculadoraScreen`, después de calcular `interesResult` y `metaResult`):

```tsx
export default function CalculadoraScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { award } = useGamification();
  const [mode, setMode] = useState<'interes' | 'meta'>('interes');
  const [selectedOption, setSelectedOption] = useState(0);

  const [capital, setCapital] = useState('10000');
  const [trea, setTrea] = useState('8');
  const [months, setMonths] = useState(12);
  const [compound, setCompound] = useState(true);

  const [meta, setMeta] = useState('20000');
  const [ahorroActual, setAhorroActual] = useState('0');
  const [goalMonths, setGoalMonths] = useState(24);

  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);
  useEffect(() => { fetchBCRPData().then(setBcrpData); }, []);
  const inflacionAnual = (bcrpData?.inflacion ?? 3.5) / 100;

  const interesResult = useMemo(
    () => calcInterest(parseFloat(capital) || 0, parseFloat(trea) || 0, months, compound, inflacionAnual),
    [capital, trea, months, compound, inflacionAnual],
  );
```

...y justo después del bloque `metaResult` (`app/(tabs)/calculadora.tsx:150`), agrega:

```tsx
  const options = useMemo(() => getOptions(goalMonths), [goalMonths]);

  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (user && interesResult) {
      award(ACTION_KEYS.CALCULATOR_USED, 3, { dedupeKey: `calculator_used:${today}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!interesResult]);

  useEffect(() => {
    if (user && metaResult) {
      award(ACTION_KEYS.CALCULATOR_USED, 3, { dedupeKey: `calculator_used:${today}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!metaResult]);
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, ve a Calculadora → modo "¿Cuánto ganaré?" con valores por defecto.
Expected: toast "+3 XP" apenas se muestra un resultado válido. Cambia el capital varias veces: no debe repetir el toast (deduplicado por día). Cambia a modo "¿Cómo llego a mi meta?": debe dar otro "+3 XP" (mismo `dedupeKey` de hoy, así que si ya ganaste por el modo interés, este segundo intento en el mismo día debe fallar silenciosamente por duplicado — confírmalo revisando que el total de XP en `/progreso` solo subió una vez, no dos, en el mismo día).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/calculadora.tsx"
git commit -m "feat: otorga XP por completar una simulación en la calculadora"
```

---

### Task 13: Mi Plan — XP por guardar y por revisar un plan

**Files:**
- Modify: `app/(tabs)/plan.tsx`

**Interfaces:**
- Consumes: `useAuth` (ya importado) de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar los imports**

Modify `app/(tabs)/plan.tsx:17-20`:

```tsx
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';
```

- [ ] **Step 2: Otorgar XP al guardar un plan**

Modify `app/(tabs)/plan.tsx:76-78` (agrega el hook) y `:121-141` (`handleSavePlan`):

```tsx
export default function PlanScreen() {
  const router = useRouter();
  const { isPro, user } = useAuth();
  const { award } = useGamification();
```

```tsx
  const handleSavePlan = useCallback(async () => {
    if (!planName.trim() || !user) return;
    setSavingPlan(true);
    const { data, error } = await supabase
      .from('savings_plans')
      .insert({
        user_id: user.id,
        nombre: planName.trim(),
        ingreso: parsed.ing,
        gastos: parsed.gast,
        savings_rate: savingsRate,
        emergency_achieved: emergencyAchieved,
      })
      .select()
      .single();
    if (!error && data) {
      setSavedPlans((prev) => [data as SavedPlan, ...prev]);
      setPlanName('');
      await award(ACTION_KEYS.PLAN_SAVED, 10, { metadata: { planId: data.id } });
    }
    setSavingPlan(false);
  }, [planName, user, parsed.ing, parsed.gast, savingsRate, emergencyAchieved, award]);
```

- [ ] **Step 3: Otorgar XP al revisar un plan guardado con 7+ días de antigüedad**

Modify `app/(tabs)/plan.tsx:143-148` (`handleLoadPlan`):

```tsx
  const handleLoadPlan = useCallback((p: SavedPlan) => {
    setIngreso(String(p.ingreso));
    setGastos(String(p.gastos));
    setSavingsRate(p.savings_rate);
    setEmergencyAchieved(p.emergency_achieved);

    const daysSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated >= 7) {
      const weekBucket = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      award(ACTION_KEYS.PLAN_REVIEWED, 8, { dedupeKey: `plan_reviewed:${p.id}:${weekBucket}` });
    }
  }, [award]);
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `pnpm web`, inicia sesión con cuenta Pro, ve a Mi Plan → guarda un plan nuevo con un nombre.
Expected: toast "+10 XP". Para probar "revisar 7+ días después" sin esperar una semana real: en el SQL Editor de Supabase, actualiza manualmente el `created_at` de esa fila en `savings_plans` a hace 10 días (`update savings_plans set created_at = now() - interval '10 days' where nombre = '...'`), recarga la app y toca el plan guardado para cargarlo. Expected: toast "+8 XP". Tócalo de nuevo inmediatamente: no debe repetir (mismo bucket de 7 días).

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/plan.tsx"
git commit -m "feat: otorga XP por guardar y por revisar un plan de ahorro"
```

---

### Task 14: Tasas — XP por seguir un producto

**Files:**
- Modify: `app/(tabs)/historial.tsx`

**Interfaces:**
- Consumes: `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar los imports y el hook**

Modify `app/(tabs)/historial.tsx:6-11`:

```tsx
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';
import { RateHistoryChart } from '@/components/RateHistoryChart';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';
```

```tsx
export default function HistorialScreen() {
  const { isPro, user } = useAuth();
  const { award } = useGamification();
```

- [ ] **Step 2: Otorgar XP solo al empezar a seguir (no al dejar de seguir)**

Modify `app/(tabs)/historial.tsx:65-78` (`toggleFollow`):

```tsx
  const toggleFollow = useCallback(async (productId: string) => {
    if (!user) return;
    const isFollowing = followedIds.has(productId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(productId); else next.add(productId);
      return next;
    });
    if (isFollowing) {
      await supabase.from('followed_products').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      await supabase.from('followed_products').insert({ user_id: user.id, product_id: productId });
      await award(ACTION_KEYS.PRODUCT_FOLLOWED, 5, { dedupeKey: `product_followed:${productId}` });
    }
  }, [user, followedIds, award]);
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión con cuenta Pro, ve a Tasas, toca el ícono 🔕 junto a un producto para seguirlo.
Expected: cambia a 🔔 y aparece el toast "+5 XP". Tócalo de nuevo para dejar de seguirlo (vuelve a 🔕): no debe dar XP. Vuelve a seguirlo: no debe dar XP otra vez (ya deduplicado por producto).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/historial.tsx"
git commit -m "feat: otorga XP por seguir un producto en el ranking de tasas"
```

---

### Task 15: Tarjetas — XP por revisar una tarjeta

**Files:**
- Modify: `app/(tabs)/tarjetas.tsx`

**Nota de diseño:** el spec original proponía "comparar tarjetas" como la acción de XP en esta pantalla, pero `tarjetas.tsx` (a diferencia del comparador principal) es una simple lista sin mecanismo de selección de par — no existe una funcionalidad real de "comparar 2 tarjetas" para instrumentar. Se sustituye por la única acción intencional que sí existe en esta pantalla: tocar "Ver en {banco}" para visitar el sitio oficial de una tarjeta.

**Interfaces:**
- Consumes: `useAuth` de `context/auth.tsx`; `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`.

- [ ] **Step 1: Agregar los imports**

Modify `app/(tabs)/tarjetas.tsx:1-8`:

```tsx
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { CREDIT_CARDS, CreditCard } from '@/constants/creditCards';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
```

- [ ] **Step 2: Otorgar XP al visitar el sitio de una tarjeta**

Modify `app/(tabs)/tarjetas.tsx:81-132` (`CardRow`):

```tsx
function CardRow({ card }: { card: CreditCard }) {
  const { user } = useAuth();
  const { award } = useGamification();

  const handleVisit = () => {
    if (user) {
      award(ACTION_KEYS.CARD_VIEWED, 5, { dedupeKey: `card_viewed:${card.id}` });
    }
    if (card.websiteUrl) Linking.openURL(card.websiteUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <CardVisual card={card} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.bank}>{card.bank}</Text>
          <Text style={styles.name}>{card.name}</Text>
        </View>
        <View style={styles.tceaBox}>
          <Text style={styles.tceaLabel}>TCEA</Text>
          <Text
            style={[
              styles.tceaValue,
              !card.tcea && styles.tceaValueMuted,
              (card.tcea?.length ?? 0) > 10 && styles.tceaValueLong,
            ]}
          >
            {card.tcea ?? 'No publicada'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Membresía</Text>
          <Text style={styles.metaValue}>{card.annualFee}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Ingreso mínimo</Text>
          <Text style={styles.metaValue}>S/ {card.minIncome.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.benefitsList}>
        {card.benefits.slice(0, 2).map((b) => (
          <View key={b} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {card.websiteUrl && (
        <TouchableOpacity style={styles.linkRow} onPress={handleVisit}>
          <Text style={styles.linkText}>Ver en {card.bank}</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, ve a Tarjetas, toca "Ver en {banco}" de cualquier tarjeta con `websiteUrl`.
Expected: se abre el sitio del banco en una pestaña nueva y aparece el toast "+5 XP" antes de que se abra la pestaña. Vuelve y toca la misma tarjeta otra vez: no repite XP. Toca una tarjeta distinta: sí da XP.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/tarjetas.tsx"
git commit -m "feat: otorga XP por revisar el sitio oficial de una tarjeta"
```

---

### Task 16: Estado de cuenta — XP por subir un análisis + racha mensual

**Files:**
- Modify: `app/estado-cuenta.tsx`

**Interfaces:**
- Consumes: `useGamification` de `context/gamification.tsx`; `ACTION_KEYS` de `lib/gamification.ts`; `getStatementMonthStreak` de `services/gamification.ts`.

- [ ] **Step 1: Agregar los imports**

Modify `app/estado-cuenta.tsx:1-12`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
import { getStatementMonthStreak } from '@/services/gamification';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';
import { CategorySpendChart, CategoriaGasto } from '@/components/CategorySpendChart';
```

- [ ] **Step 2: Otorgar XP tras un análisis exitoso**

Modify `app/estado-cuenta.tsx:54-58` (agrega el hook) y `:100-104` (dentro de `handlePick`, justo después de guardar el resultado):

```tsx
export default function EstadoCuentaScreen() {
  const router = useRouter();
  const { user, isPro } = useAuth();
  const { award } = useGamification();
  const [picking, setPicking] = useState(false);
```

```tsx
      if (data?.error) throw new Error(data.error);

      setResult(data as Analysis);
      setHistory((prev) => [data as Analysis, ...prev]);

      if (user) {
        await award(ACTION_KEYS.STATEMENT_UPLOADED, 20, { metadata: { analysisId: (data as Analysis).id } });
        const monthStreak = await getStatementMonthStreak(user.id);
        if (monthStreak >= 2) {
          const monthBucket = new Date().toISOString().slice(0, 7);
          await award(ACTION_KEYS.STATEMENT_STREAK, 25, { dedupeKey: `statement_streak:${monthBucket}` });
        }
      }
    } catch (err) {
```

(la línea `} catch (err) {` ya existe en el archivo original — este step la reemplaza junto con el bloque que la precede, no la duplica.)

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm web`, inicia sesión, ve a Mi Plan → "Analiza tu estado de cuenta" → sube un PDF de prueba.
Expected: al terminar el análisis, toast "+20 XP". Para probar la racha mensual sin esperar meses reales: en Supabase, inserta manualmente 2 filas más en `bank_statement_analyses` para el mismo usuario con `created_at` en los 2 meses calendario anteriores, recarga la pantalla y sube otro PDF. Expected: además del "+20 XP" del análisis, debe aparecer un segundo toast/evento "+25 XP" y, en `/progreso`, el logro "Ojo de águila" debe desbloquearse si ya son 3 meses consecutivos.

- [ ] **Step 5: Commit**

```bash
git add app/estado-cuenta.tsx
git commit -m "feat: otorga XP por subir un estado de cuenta y por constancia mensual"
```

---

### Task 17: Estado de cuenta — marcar recomendaciones como aplicadas

**Files:**
- Modify: `app/estado-cuenta.tsx`

**Interfaces:**
- Consumes: `supabase` (ya importado); `award` de `useGamification` (ya disponible desde la Task 16); `ACTION_KEYS.RECOMMENDATION_APPLIED`.
- Produces: `toggleAplicado(analysis: Analysis, index: number): Promise<void>` dentro de `EstadoCuentaScreen`.

- [ ] **Step 1: Agregar el campo al tipo `Analysis`**

Modify `app/estado-cuenta.tsx:31-41`:

```tsx
interface Analysis {
  id: string;
  created_at: string;
  periodo: string | null;
  total_gastado: number;
  categorias: CategoriaGasto[];
  top_gastos: TopGasto[];
  gastos_evitables: GastoEvitable[];
  recomendaciones: string[];
  plan_ahorro: PlanAhorro;
  gastos_evitables_aplicados?: number[];
}
```

- [ ] **Step 2: Agregar `toggleAplicado`**

Modify `app/estado-cuenta.tsx` — agrega esta función dentro de `EstadoCuentaScreen`, junto a `handlePick`:

```tsx
  const toggleAplicado = useCallback(async (analysis: Analysis, index: number) => {
    const current = analysis.gastos_evitables_aplicados ?? [];
    const already = current.includes(index);
    const next = already ? current.filter((i) => i !== index) : [...current, index];

    await supabase.from('bank_statement_analyses').update({ gastos_evitables_aplicados: next }).eq('id', analysis.id);

    const updated = { ...analysis, gastos_evitables_aplicados: next };
    setResult((prev) => (prev?.id === analysis.id ? updated : prev));
    setHistory((prev) => prev.map((h) => (h.id === analysis.id ? updated : h)));

    if (!already && user) {
      await award(ACTION_KEYS.RECOMMENDATION_APPLIED, 15, {
        dedupeKey: `recommendation_applied:${analysis.id}:${index}`,
      });
    }
  }, [user, award]);
```

- [ ] **Step 3: Agregar el checkbox al listado de gastos evitables**

Modify `app/estado-cuenta.tsx:143-156` (dentro de `renderResult`, bloque `analysis.gastos_evitables`):

```tsx
      {analysis.gastos_evitables?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gastos que podrías evitar</Text>
          {analysis.gastos_evitables.map((g, i) => {
            const aplicado = (analysis.gastos_evitables_aplicados ?? []).includes(i);
            return (
              <View key={i} style={styles.evitableRow}>
                <View style={styles.evitableHeader}>
                  <Text style={styles.listDesc} numberOfLines={1}>{g.descripcion}</Text>
                  <Text style={[styles.listAmount, { color: Colors.danger }]}>{fmt(g.monto)}</Text>
                </View>
                <Text style={styles.evitableMotivo}>{g.motivo}</Text>
                <TouchableOpacity style={styles.aplicadoBtn} onPress={() => toggleAplicado(analysis, i)}>
                  <Text style={[styles.aplicadoText, aplicado && styles.aplicadoTextActive]}>
                    {aplicado ? '✓ Aplicado' : 'Marcar como aplicado'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
```

- [ ] **Step 4: Agregar los estilos nuevos**

Modify `app/estado-cuenta.tsx` — dentro de `StyleSheet.create`, junto a `evitableMotivo`:

```ts
  aplicadoBtn: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  aplicadoText: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary },
  aplicadoTextActive: { color: Colors.accent },
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación manual**

Run: `pnpm web`, inicia sesión Pro, abre un análisis existente con gastos evitables, toca "Marcar como aplicado" en uno.
Expected: cambia a "✓ Aplicado" en verde y aparece el toast "+15 XP". Recarga la página y vuelve a abrir el mismo análisis desde el historial: el estado "✓ Aplicado" debe persistir (viene de `gastos_evitables_aplicados` guardado en Supabase). Tócalo de nuevo para desmarcarlo: vuelve a "Marcar como aplicado" y no da ni quita XP. Vuelve a marcarlo: no debe repetir el XP (deduplicado por análisis + índice).

- [ ] **Step 7: Commit**

```bash
git add app/estado-cuenta.tsx
git commit -m "feat: permite marcar recomendaciones como aplicadas y otorga XP"
```

---

## Self-Review

**Cobertura del spec:** las 11 fuentes de XP de la tabla del spec están cubiertas (Tasks 9–17, con la desviación documentada en Task 15 para Tarjetas). Niveles y nombres (Task 2), logros (Tasks 3–4, evaluados en Task 4), badge persistente + pantalla `/progreso` (Tasks 6–8), migración del quiz legado (Task 4 + Task 9), fuera de alcance (leaderboards, push, compartir) — no se tocan, correcto.

**Placeholders:** ninguno — cada step tiene código completo y ejecutable.

**Consistencia de tipos:** `ACTION_KEYS` (Task 2) se usa con las mismas claves en Tasks 4, 9–17. `award(actionKey, xpAmount, opts)` tiene la misma firma en el contexto (Task 5) y en todos los call-sites. `Analysis.gastos_evitables_aplicados` (Task 17) coincide con la columna `gastos_evitables_aplicados` creada en Task 1. `LevelInfo` (Task 2) se consume igual en `GamificationBadge` (Task 6), `/progreso` (Task 7) y `DesktopSidebar` (Task 8) con los mismos campos (`level`, `name`, `progress`, `xpIntoLevel`, `xpNeededForLevel`).
