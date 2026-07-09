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
