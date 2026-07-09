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
