import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';

const NAV_ITEMS: { href: '/' | '/calculadora' | '/plan' | '/historial' | '/glosario' | '/tarjetas'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: '/', label: 'Comparar', icon: 'bar-chart-outline' },
  { href: '/calculadora', label: 'Calculadora', icon: 'calculator-outline' },
  { href: '/plan', label: 'Mi Plan', icon: 'trending-up-outline' },
  { href: '/historial', label: 'Tasas del día', icon: 'stats-chart-outline' },
  { href: '/glosario', label: 'Glosario', icon: 'book-outline' },
  { href: '/tarjetas', label: 'Tarjetas', icon: 'card-outline' },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isPro, signOut } = useAuth();
  const { levelInfo } = useGamification();
  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);

  useEffect(() => { fetchBCRPData().then(setBcrpData); }, []);

  const initial = (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Ahorra<Text style={{ color: '#5BC98A' }}>Perú</Text></Text>

      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            key={item.href}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => router.push(item.href)}
          >
            <Ionicons name={item.icon} size={17} color={active ? '#fff' : '#9FB0A6'} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}

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
        <Text style={styles.bcrpTitle}>BCRP · TIEMPO REAL</Text>
        <View style={styles.bcrpRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.bcrpLabel}>Tasa referencia</Text>
          <Text style={styles.bcrpValue}>{bcrpData?.tasaReferencia != null ? `${bcrpData.tasaReferencia}%` : '—'}</Text>
        </View>
        <View style={styles.bcrpRow}>
          <Text style={[styles.bcrpLabel, { marginLeft: 15 }]}>Inflación mensual</Text>
          <Text style={[styles.bcrpValue, { color: '#5BC98A' }]}>{bcrpData?.inflacion != null ? `${bcrpData.inflacion}%` : '—'}</Text>
        </View>
      </View>

      {user ? (
        <Pressable style={styles.userRow} onPress={signOut}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View>
            <Text style={styles.userName}>{user.email}</Text>
            <Text style={styles.userPlan}>{isPro ? 'Plan Pro' : 'Plan gratuito'}</Text>
          </View>
          <Ionicons name="log-out-outline" size={16} color="#9FB0A6" style={{ marginLeft: 'auto' }} />
        </Pressable>
      ) : (
        <Pressable style={styles.loginRow} onPress={() => router.push('/login')}>
          <Ionicons name="log-in-outline" size={17} color="#fff" />
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 248,
    flexShrink: 0,
    backgroundColor: Colors.textPrimary,
    paddingVertical: 26,
    paddingHorizontal: 18,
    gap: 6,
  },
  logo: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 22,
    color: '#F6F4EC',
    letterSpacing: -0.5,
    paddingHorizontal: 10,
    paddingBottom: 22,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  navItemActive: { backgroundColor: Colors.primary },
  navText: { fontSize: 14.5, fontFamily: 'Figtree_500Medium', color: '#9FB0A6' },
  navTextActive: { fontFamily: 'Figtree_600SemiBold', color: '#fff' },
  spacer: { flex: 1, minHeight: 20 },
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
  bcrpCard: {
    backgroundColor: '#1C3128',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  bcrpTitle: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: '#8FA79A', letterSpacing: 1, marginBottom: 12 },
  bcrpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#5BC98A' },
  bcrpLabel: { fontSize: 12.5, fontFamily: 'Figtree_400Regular', color: '#C8D2CB' },
  bcrpValue: { marginLeft: 'auto', fontFamily: 'Archivo_800ExtraBold', fontSize: 13, color: '#F6F4EC' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 8 },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Colors.primary,
    borderRadius: 11,
    paddingVertical: 12,
  },
  loginText: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: '#fff' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Archivo_800ExtraBold', color: '#fff', fontSize: 14 },
  userName: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: '#F6F4EC', maxWidth: 150 },
  userPlan: { fontSize: 11.5, fontFamily: 'Figtree_400Regular', color: '#8FA79A' },
});
