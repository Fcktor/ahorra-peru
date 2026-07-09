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
