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
  {
    icon: '📊',
    title: 'Compara tasas en tiempo real',
    desc: 'Depósitos a plazo, fondos mutuos, CTS y más. Datos actualizados del BCRP.',
  },
  {
    icon: '🧮',
    title: 'Calculadora de intereses',
    desc: 'Simula cuánto ganarás con cualquier monto, tasa y plazo.',
  },
  {
    icon: '📈',
    title: 'Tu plan de ahorro personalizado',
    desc: 'Estrategia en capas según tu fase financiera. Fondo de emergencia primero.',
  },
  {
    icon: '📚',
    title: 'Glosario financiero',
    desc: 'TREA, FSD, fondos mutuos... todo explicado en simple.',
  },
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* NAV */}
        <View style={styles.nav}>
          <Text style={styles.navLogo}>💰 AhorraPeru</Text>
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
                <Text style={styles.checkGreen}>✓</Text>
                <Text style={styles.planFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.planBtnFree} onPress={handleCTA}>
              <Text style={styles.planBtnFreeText}>Empezar gratis</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.pricingCardPro]}>
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
            <Text style={[styles.planName, { color: '#FFF' }]}>Pro</Text>
            <Text style={[styles.planPrice, { color: '#FFF' }]}>S/ 12<Text style={[styles.planPer, { color: 'rgba(255,255,255,0.6)' }]}>/mes</Text></Text>
            {['Todo lo de gratis', 'Guardar múltiples planes', 'Alertas de tasa', 'Historial de tasas', 'Exportar plan a PDF'].map((f) => (
              <View key={f} style={styles.planFeatureRow}>
                <Text style={styles.checkWhite}>✓</Text>
                <Text style={[styles.planFeatureText, { color: 'rgba(255,255,255,0.85)' }]}>{f}</Text>
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
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { paddingBottom: 0 },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navLogo: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  navLink: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'flex-start',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  heroBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroTitle: { fontSize: 38, fontWeight: '900', color: '#FFF', lineHeight: 46, marginBottom: 14 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 23, marginBottom: 28 },
  heroCTA: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 12,
  },
  heroCTAText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  heroNote: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  section: {
    backgroundColor: Colors.background,
    marginTop: 8,
    padding: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  institutionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  institutionChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  institutionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  featureCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingCardPro: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  proBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  proBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  planName: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  planPrice: { fontSize: 40, fontWeight: '900', color: Colors.primary, marginBottom: 16 },
  planPer: { fontSize: 16, color: Colors.textMuted },
  planFeatureRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' },
  checkGreen: { fontSize: 14, color: Colors.accent, fontWeight: '800' },
  checkWhite: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '800' },
  planFeatureText: { fontSize: 14, color: Colors.textSecondary },
  planBtnFree: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnFreeText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  planBtnPro: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planBtnProText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  finalCTA: {
    backgroundColor: Colors.accent,
    padding: 32,
    alignItems: 'center',
  },
  finalTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 10 },
  finalSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  finalBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  finalBtnText: { fontSize: 15, fontWeight: '800', color: Colors.accent },

  footer: {
    backgroundColor: Colors.primary,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
