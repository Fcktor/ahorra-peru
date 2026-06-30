import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';

const FEATURES = [
  { icon: '📊', title: 'Compara tasas en tiempo real', desc: 'Depósitos a plazo, fondos mutuos, CTS y más. Datos actualizados del BCRP.' },
  { icon: '🧮', title: 'Calculadora de intereses', desc: 'Simula cuánto ganarás con cualquier monto, tasa y plazo.' },
  { icon: '📈', title: 'Tu plan de ahorro personalizado', desc: 'Estrategia en capas según tu fase financiera. Fondo de emergencia primero.' },
  { icon: '📚', title: 'Glosario financiero', desc: 'TREA, FSD, fondos mutuos... todo explicado en simple.' },
];

const INSTITUTIONS = ['BCP', 'Interbank', 'BBVA', 'CMAC Arequipa', 'Credifondos', 'Interfondos', 'AFP Habitat', 'Scotiabank'];

export default function LandingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) router.replace('/');
    else router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* NAV */}
        <View style={styles.nav}>
          <Text style={styles.navLogo}>AhorraPeru</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.navLink}>{user ? 'Ir a la app →' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Datos reales del BCRP</Text>
          </View>
          <Text style={styles.heroTitle}>
            ¿Dónde hacer{'\n'}crecer tus soles?
          </Text>
          <Text style={styles.heroSub}>
            Compara tasas de bancos, cajas y fondos mutuos en Perú.
            Toma decisiones financieras con información real, no suposiciones.
          </Text>
          <TouchableOpacity style={styles.heroCTA} onPress={handleCTA}>
            <Text style={styles.heroCTAText}>Empezar gratis →</Text>
          </TouchableOpacity>
          <Text style={styles.heroNote}>Sin tarjeta de crédito. Siempre gratis para empezar.</Text>
        </View>

        {/* STATS */}
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

        {/* INSTITUCIONES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Comparamos</Text>
          <View style={styles.institutionsGrid}>
            {INSTITUTIONS.map((name) => (
              <View key={name} style={styles.institutionChip}>
                <Text style={styles.institutionText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Todo lo que necesitas</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* PRICING */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Planes</Text>

          <View style={styles.pricingCard}>
            <Text style={styles.planName}>Gratis</Text>
            <Text style={styles.planPrice}>S/ 0<Text style={styles.planPer}>/mes</Text></Text>
            {['Comparador de tasas', 'Calculadora', 'Mi Plan básico', 'Glosario'].map((f) => (
              <View key={f} style={styles.planFeatureRow}>
                <Text style={styles.checkFree}>✓</Text>
                <Text style={styles.planFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.planBtnFree} onPress={handleCTA}>
              <Text style={styles.planBtnFreeText}>Empezar gratis</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.pricingCardPro]}>
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
            <Text style={[styles.planName, { color: Colors.textPrimary }]}>Pro</Text>
            <Text style={[styles.planPrice, { color: Colors.primary }]}>S/ 12<Text style={[styles.planPer, { color: Colors.textMuted }]}>/mes</Text></Text>
            {['Todo lo de gratis', 'Guardar múltiples planes', 'Alertas de tasa', 'Historial de tasas', 'Exportar plan a PDF'].map((f) => (
              <View key={f} style={styles.planFeatureRow}>
                <Text style={styles.checkPro}>✓</Text>
                <Text style={[styles.planFeatureText, { color: Colors.textSecondary }]}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.planBtnPro} onPress={() => router.push('/upgrade')}>
              <Text style={styles.planBtnProText}>Suscribirme</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FINAL CTA */}
        <View style={styles.finalCTA}>
          <Text style={styles.finalTitle}>Tu dinero puede trabajar más</Text>
          <Text style={styles.finalSub}>
            La diferencia entre una cuenta de ahorros al 1% y un depósito a plazo al 10%
            en S/ 10,000 es S/ 900 al año. Empieza hoy.
          </Text>
          <TouchableOpacity style={styles.finalBtn} onPress={handleCTA}>
            <Text style={styles.finalBtnText}>Comparar ahora — es gratis</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 AhorraPeru · Datos del BCRP y SBS</Text>
          <Text style={styles.footerText}>No somos asesores financieros. Infórmate antes de invertir.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 0 },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navLogo: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary },
  navLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'flex-start',
  },
  heroBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  heroBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  heroTitle: {
    fontSize: 38,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
    lineHeight: 46,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 28,
  },
  heroCTA: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 12,
  },
  heroCTAText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },
  heroNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHigh,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },

  section: {
    backgroundColor: Colors.surface,
    marginTop: 8,
    padding: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  institutionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  institutionChip: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  institutionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  featureCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  featureDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  pricingCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingCardPro: {
    borderColor: Colors.primary + '60',
    borderWidth: 2,
  },
  proBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  proBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.background, letterSpacing: 1 },
  planName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textMuted, marginBottom: 4 },
  planPrice: { fontSize: 40, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.textSecondary, marginBottom: 16 },
  planPer: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  planFeatureRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' },
  checkFree: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textMuted },
  checkPro: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary },
  planFeatureText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  planBtnFree: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnFreeText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  planBtnPro: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnProText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.background },

  finalCTA: {
    backgroundColor: Colors.surfaceHigh,
    padding: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '30',
    marginTop: 8,
  },
  finalTitle: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  finalSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  finalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  finalBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.background },

  footer: {
    backgroundColor: Colors.surface,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
});
