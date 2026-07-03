import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'glossary_quiz_progress_v1';

export interface QuizProgress {
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  correctCounts: Record<string, number>;
}

const EMPTY_PROGRESS: QuizProgress = {
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  correctCounts: {},
};

export async function loadQuizProgress(): Promise<QuizProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export async function saveQuizProgress(progress: QuizProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // almacenamiento no disponible — el progreso solo vive en memoria de esta sesión
  }
}
