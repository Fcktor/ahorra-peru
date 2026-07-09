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
