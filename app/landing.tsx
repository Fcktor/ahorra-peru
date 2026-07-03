import { useEffect, useRef, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const GLASS_BORDER = 'rgba(22,33,27,0.06)';
const GROOVE = 'rgba(22,33,27,0.02)';
const HAIRLINE = 'rgba(22,33,27,0.08)';
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: Colors.riskBajo,
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

const FEATURES = [
  { icon: 'stats-chart-outline' as const, title: 'Compara tasas en tiempo real', desc: 'Depósitos a plazo, fondos mutuos, CTS y más. Datos actualizados del BCRP.', tint: Colors.primary },
  { icon: 'calculator-outline' as const, title: 'Calculadora de intereses', desc: 'Simula cuánto ganarás con cualquier monto, tasa y plazo.', tint: Colors.riskBajo },
  { icon: 'trending-up-outline' as const, title: 'Tu plan de ahorro personalizado', desc: 'Estrategia en capas según tu fase financiera. Fondo de emergencia primero.', tint: Colors.highlightDark },
  { icon: 'book-outline' as const, title: 'Glosario financiero', desc: 'TREA, FSD, fondos mutuos... todo explicado en simple.', tint: Colors.accent },
];

const INSTITUTIONS = ['BCP', 'Interbank', 'BBVA', 'CMAC Arequipa', 'Credifondos', 'Interfondos', 'AFP Habitat', 'Scotiabank'];

const TOP_PRODUCTS = [...SAVINGS_OPTIONS].sort((a, b) => b.rateMax - a.rateMax).slice(0, 3);

function PressScale({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={() => press(0.97)} onPressOut={() => press(1)} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

function useCascade(count: number, stagger = 90) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      stagger,
      values.map((v) => Animated.timing(v, { toValue: 1, duration: 700, easing: EASE, useNativeDriver: true }))
    ).start();
  }, []);
  return values;
}

function reveal(v: Animated.Value) {
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
}

function Bloom({ color, size, style }: { color: string; size: number; style?: any }) {
  return (
    <View style={[{ position: 'absolute', width: size, height: size }, style, styles.noEvents]}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.05 }} />
      <View style={{ position: 'absolute', width: size * 0.62, height: size * 0.62, borderRadius: (size * 0.62) / 2, top: size * 0.19, left: size * 0.19, backgroundColor: color, opacity: 0.07 }} />
      <View style={{ position: 'absolute', width: size * 0.3, height: size * 0.3, borderRadius: (size * 0.3) / 2, top: size * 0.35, left: size * 0.35, backgroundColor: color, opacity: 0.09 }} />
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const twoCols = width >= 480;

  const cascade = useCascade(5);

  const handleCTA = () => {
    if (user) router.replace('/');
    else router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <View style={styles.hero}>
          <Bloom color={Colors.primaryLight} size={280} style={{ top: -100, right: -80 }} />
          <Bloom color={Colors.riskBajo} size={220} style={{ top: 170, left: -110 }} />

          <Animated.View style={reveal(cascade[0])}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={12} color={Colors.primary} />
              <Text style={styles.heroBadgeText}>Datos reales del BCRP</Text>
            </View>
          </Animated.View>

          <Animated.Text style={[styles.heroTitle, reveal(cascade[1])]}>
            ¿Dónde hacer{'\n'}crecer tus soles?
          </Animated.Text>

          <Animated.Text style={[styles.heroSub, reveal(cascade[2])]}>
            Compara tasas de bancos, cajas y fondos mutuos en Perú.
            Toma decisiones financieras con información real, no suposiciones.
          </Animated.Text>

          <Animated.View style={reveal(cascade[3])}>
            <PressScale onPress={handleCTA} style={styles.ctaWrap}>
              <View style={[styles.heroCTA, styles.ctaSolid]}>
                <Text style={styles.heroCTAText}>Empezar gratis</Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.background} />
                </View>
              </View>
            </PressScale>
          </Animated.View>
        </View>

        {/* STATS — double bezel */}
        <Animated.View style={[styles.bezelOuter, styles.statsOuter, reveal(cascade[4])]}>
          <View style={styles.bezelInner}>
            <View style={styles.hairline} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>8+</Text>
                <Text style={styles.statLabel}>Opciones de ahorro</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>12%</Text>
                <Text style={styles.statLabel}>Tasa máxima TREA</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>100%</Text>
                <Text style={styles.statLabel}>Datos del BCRP</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* INSTITUCIONES */}
        <View style={styles.section}>
          <View style={styles.institutionsGrid}>
            {INSTITUTIONS.map((name) => (
              <View key={name} style={styles.institutionChip}>
                <Text style={styles.institutionText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FEATURES — fila de iconos, sin chrome de card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Todo lo que necesitas</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureItem, { width: twoCols ? '48%' : '100%' }]}>
                <View style={[styles.featureIconCircle, { backgroundColor: f.tint + '18' }]}>
                  <Ionicons name={f.icon} size={20} color={f.tint} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PRODUCTOS DESTACADOS */}
        <View style={styles.section}>
          <View style={styles.productsRow}>
            {TOP_PRODUCTS.map((p) => {
              const color = RISK_COLORS[p.risk];
              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={[styles.productSwatch, { backgroundColor: color + '15' }]}>
                    <Ionicons name="trending-up" size={18} color={color} />
                  </View>
                  <Text style={styles.productInstitution} numberOfLines={1}>{p.institution}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                  <View style={[styles.productBadge, { backgroundColor: color + '15' }]}>
                    <Text style={[styles.productBadgeText, { color }]}>
                      {p.rateMin === p.rateMax ? `${p.rateMin}%` : `${p.rateMin}–${p.rateMax}%`} TREA
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* PRICING */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Planes</Text>

          <View style={[styles.bezelOuter, styles.pricingOuter]}>
            <View style={styles.bezelInner}>
              <View style={styles.hairline} />
              <Text style={styles.planName}>Gratis</Text>
              <Text style={styles.planPrice}>S/ 0<Text style={styles.planPer}>/mes</Text></Text>
              {['Comparador de tasas', 'Calculadora', 'Mi Plan básico', 'Glosario'].map((f) => (
                <View key={f} style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={16} color={Colors.textMuted} />
                  <Text style={styles.planFeatureText}>{f}</Text>
                </View>
              ))}
              <PressScale onPress={handleCTA} style={styles.planBtnFree}>
                <Text style={styles.planBtnFreeText}>Empezar gratis</Text>
              </PressScale>
            </View>
          </View>

          <View style={[styles.bezelOuter, styles.pricingOuter, styles.pricingOuterPro]}>
            <View style={[styles.bezelInner, styles.bezelInnerPro]}>
              <Bloom color={Colors.highlightLight} size={180} style={{ top: -55, right: -55 }} />
              <View style={styles.hairline} />
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
              <Text style={[styles.planName, { color: Colors.textPrimary }]}>Pro</Text>
              <Text style={[styles.planPrice, { color: Colors.highlightDark }]}>S/ 12<Text style={[styles.planPer, { color: Colors.textMuted }]}>/mes</Text></Text>
              {['Todo lo de gratis', 'Guardar múltiples planes', 'Alertas de tasa', 'Historial de tasas', 'Exportar plan a PDF'].map((f) => (
                <View key={f} style={styles.planFeatureRow}>
                  <Ionicons name="checkmark" size={16} color={Colors.highlightDark} />
                  <Text style={[styles.planFeatureText, { color: Colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
              <PressScale onPress={() => router.push('/upgrade')} style={styles.ctaWrap}>
                <View style={[styles.heroCTA, styles.ctaSolid]}>
                  <Text style={styles.heroCTAText}>Suscribirme</Text>
                  <View style={styles.ctaIcon}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.background} />
                  </View>
                </View>
              </PressScale>
            </View>
          </View>
        </View>

        {/* FINAL CTA */}
        <View style={styles.finalCTA}>
          <Bloom color={Colors.primaryLight} size={240} style={{ top: -60, left: -60 }} />
          <Text style={styles.finalTitle}>Tu dinero puede trabajar más</Text>
          <Text style={styles.finalSub}>
            La diferencia entre una cuenta de ahorros al 1% y un depósito a plazo al 10%
            en S/ 10,000 es S/ 900 al año. Empieza hoy.
          </Text>
          <PressScale onPress={handleCTA} style={styles.ctaWrap}>
            <View style={[styles.heroCTA, styles.ctaSolid]}>
              <Text style={styles.heroCTAText}>Comparar ahora, es gratis</Text>
              <View style={styles.ctaIcon}>
                <Ionicons name="arrow-forward" size={16} color={Colors.background} />
              </View>
            </View>
          </PressScale>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 AhorraPeru · Datos del BCRP y SBS</Text>
          <Text style={styles.footerText}>No somos asesores financieros. Infórmate antes de invertir.</Text>
        </View>

      </ScrollView>

      {/* FLOATING NAV */}
      <BlurView intensity={50} tint="light" style={styles.navBlur}>
        <Text style={styles.navLogo}>AhorraPeru</Text>
        <Pressable onPress={() => router.push('/login')} style={styles.navLinkRow}>
          <Text style={styles.navLink}>{user ? 'Ir a la app' : 'Iniciar sesión'}</Text>
          <Ionicons name="arrow-forward" size={13} color={Colors.textSecondary} />
        </Pressable>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 88, paddingBottom: 0 },

  navBlur: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HAIRLINE,
    overflow: 'hidden',
    minWidth: '86%',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  navLogo: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary },
  navLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 44,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  noEvents: { pointerEvents: 'none' },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '12',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  heroBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: {
    fontSize: 42,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
    lineHeight: 49,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 28,
  },

  ctaWrap: { alignSelf: 'flex-start' },
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 999,
    paddingLeft: 26,
    paddingRight: 6,
    paddingVertical: 6,
  },
  ctaSolid: { backgroundColor: Colors.primary },
  heroCTAText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.background },
  ctaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bezelOuter: {
    padding: 5,
    borderRadius: 28,
    backgroundColor: GROOVE,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  bezelInner: {
    borderRadius: 23,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    overflow: 'hidden',
  },
  bezelInnerPro: { backgroundColor: Colors.surface },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: HAIRLINE,
  },

  statsOuter: { marginHorizontal: 20, marginBottom: 4 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },

  section: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 18,
  },

  institutionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  institutionChip: {
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  institutionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  featureItem: {},
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: { fontSize: 14.5, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 6, lineHeight: 20 },
  featureDesc: { fontSize: 12.5, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  productsRow: { flexDirection: 'row', gap: 12 },
  productCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  productSwatch: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  productInstitution: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 3, marginBottom: 10, lineHeight: 17, minHeight: 34 },
  productBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  productBadgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },

  pricingOuter: { marginBottom: 14 },
  pricingOuterPro: { borderColor: Colors.highlight + '30' },
  proBadge: {
    backgroundColor: Colors.highlightDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  proBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.background, letterSpacing: 1 },
  planName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textMuted, marginBottom: 4 },
  planPrice: { fontSize: 38, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.textSecondary, marginBottom: 18 },
  planPer: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  planFeatureRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' },
  planFeatureText: { fontSize: 13.5, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  planBtnFree: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnFreeText: { fontSize: 14.5, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },

  finalCTA: {
    padding: 32,
    paddingVertical: 56,
    alignItems: 'center',
    overflow: 'hidden',
  },
  finalTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  finalSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 28, maxWidth: 340 },

  footer: {
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
});
