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
