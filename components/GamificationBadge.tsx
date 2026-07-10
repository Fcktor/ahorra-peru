// components/GamificationBadge.tsx
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { useIsDesktop } from '@/hooks/useIsDesktop';

// Mismo motivo de crecimiento que el logro "Primeros pasos" (🌱), extendido por nivel.
const LEVEL_ICONS = ['🌱', '🌿', '🍃', '🌳', '🏆'];

function iconForLevel(level: number) {
  return LEVEL_ICONS[Math.min(level - 1, LEVEL_ICONS.length - 1)];
}

export default function GamificationBadge() {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { levelInfo } = useGamification();
  const router = useRouter();

  if (!user || isDesktop) return null;

  return (
    <Pressable style={styles.card} onPress={() => router.push('/progreso')} hitSlop={6}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{iconForLevel(levelInfo.level)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.level} numberOfLines={1}>Nivel {levelInfo.level} · {levelInfo.name}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(6, Math.round(levelInfo.progress * 100))}%` }]} />
        </View>
        <Text style={styles.xp}>{levelInfo.xpIntoLevel}/{levelInfo.xpNeededForLevel} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 50,
    right: 16,
    maxWidth: 220,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  body: { flexShrink: 1 },
  level: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.surface, marginBottom: 5 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: Colors.highlight, borderRadius: 3 },
  xp: { fontSize: 10, fontFamily: 'Figtree_600SemiBold', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
