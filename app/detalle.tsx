import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: Colors.riskBajo,
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const option = SAVINGS_OPTIONS.find((o) => o.id === id);

  if (!option) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Opción no encontrada</Text>
      </SafeAreaView>
    );
  }

  const riskColor = RISK_COLORS[option.risk] ?? Colors.textMuted;
  const rateDisplay =
    option.rateMin === option.rateMax
      ? `${option.rateMin}%`
      : `${option.rateMin}% – ${option.rateMax}%`;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: option.institution }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.heroCard}>
          <Text style={styles.institution}>{option.institution}</Text>
          <Text style={styles.name}>{option.name}</Text>
          <Text style={styles.rate}>{rateDisplay}</Text>
          <Text style={styles.rateLabel}>{option.rateLabel ?? 'TREA anual en soles'}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Riesgo" value={option.risk} color={riskColor} />
          <StatBox label="Liquidez" value={option.liquidity} color={Colors.riskBajo} />
          <StatBox
            label="Mínimo"
            value={option.minAmount > 0 ? `S/ ${option.minAmount.toLocaleString()}` : 'Sin mínimo'}
            color={Colors.textSecondary}
          />
        </View>

        <Section title="¿Qué es?">
          <Text style={styles.bodyText}>{option.description}</Text>
        </Section>

        <Section title="✅ Ventajas">
          {option.pros.map((p, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{p}</Text>
            </View>
          ))}
        </Section>

        <Section title="⚠️ Desventajas">
          {option.cons.map((c, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{c}</Text>
            </View>
          ))}
        </Section>

        <Section title="🚀 Cómo empezar">
          <View style={styles.howToBox}>
            <Text style={styles.bodyText}>{option.howToStart}</Text>
          </View>
        </Section>

        {option.websiteUrl && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => Linking.openURL(option.websiteUrl!)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Ir al sitio oficial</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  error: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.danger, padding: 20 },
  heroCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  institution: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 4, textAlign: 'center' },
  rate: { fontSize: 52, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary, marginTop: 12 },
  rateLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 2, textTransform: 'uppercase' },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 10 },
  bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 21 },
  listRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  bullet: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary, marginTop: 1 },
  listText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 21, flex: 1 },
  howToBox: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ctaText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },
  ctaArrow: { fontSize: 18, color: Colors.background },
});
