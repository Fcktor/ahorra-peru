import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: '#5DADE2',
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

export default function CompararScreen() {
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
  const router = useRouter();
  const optA = SAVINGS_OPTIONS.find((o) => o.id === a);
  const optB = SAVINGS_OPTIONS.find((o) => o.id === b);

  if (!optA || !optB) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20, color: Colors.danger }}>Opciones no encontradas.</Text>
      </SafeAreaView>
    );
  }

  const rateA = optA.rateMin === optA.rateMax ? `${optA.rateMin}%` : `${optA.rateMin}–${optA.rateMax}%`;
  const rateB = optB.rateMin === optB.rateMax ? `${optB.rateMin}%` : `${optB.rateMin}–${optB.rateMax}%`;

  const betterRate = optA.rateMax >= optB.rateMax ? 'a' : 'b';
  const betterRisk = ['muy bajo', 'bajo', 'medio', 'alto'].indexOf(optA.risk) <= ['muy bajo', 'bajo', 'medio', 'alto'].indexOf(optB.risk) ? 'a' : 'b';
  const betterLiquidity = ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'].indexOf(optA.liquidity) <= ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'].indexOf(optB.liquidity) ? 'a' : 'b';
  const betterMin = optA.minAmount <= optB.minAmount ? 'a' : 'b';

  const maxPros = Math.max(optA.pros.length, optB.pros.length);
  const maxCons = Math.max(optA.cons.length, optB.cons.length);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Comparar', headerBackTitle: 'Volver', headerTintColor: Colors.primary }} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* CABECERA FIJA */}
        <View style={styles.header}>
          <View style={styles.headerCol}>
            <Text style={styles.headerInstitution}>{optA.institution}</Text>
            <Text style={styles.headerName}>{optA.name}</Text>
          </View>
          <View style={styles.headerDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.headerCol, styles.headerColRight]}>
            <Text style={styles.headerInstitution}>{optB.institution}</Text>
            <Text style={styles.headerName}>{optB.name}</Text>
          </View>
        </View>

        {/* TASAS */}
        <Row
          label="TREA anual"
          valA={rateA}
          valB={rateB}
          winner={betterRate}
          colorA={Colors.accent}
          colorB={Colors.accent}
          sizeA={28}
          sizeB={28}
        />

        {/* RIESGO */}
        <Row
          label="Riesgo"
          valA={optA.risk}
          valB={optB.risk}
          winner={betterRisk}
          colorA={RISK_COLORS[optA.risk]}
          colorB={RISK_COLORS[optB.risk]}
        />

        {/* LIQUIDEZ */}
        <Row
          label="Liquidez"
          valA={optA.liquidity}
          valB={optB.liquidity}
          winner={betterLiquidity}
          colorA={Colors.primaryLight}
          colorB={Colors.primaryLight}
        />

        {/* MÍNIMO */}
        <Row
          label="Monto mínimo"
          valA={optA.minAmount > 0 ? `S/ ${optA.minAmount.toLocaleString()}` : 'Sin mínimo'}
          valB={optB.minAmount > 0 ? `S/ ${optB.minAmount.toLocaleString()}` : 'Sin mínimo'}
          winner={betterMin}
          colorA={Colors.textPrimary}
          colorB={Colors.textPrimary}
        />

        {/* PROS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventajas</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              {optA.pros.map((p, i) => <BulletItem key={i} text={p} color={Colors.accent} />)}
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              {optB.pros.map((p, i) => <BulletItem key={i} text={p} color={Colors.accent} />)}
            </View>
          </View>
        </View>

        {/* CONTRAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desventajas</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              {optA.cons.map((c, i) => <BulletItem key={i} text={c} color={Colors.danger} />)}
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              {optB.cons.map((c, i) => <BulletItem key={i} text={c} color={Colors.danger} />)}
            </View>
          </View>
        </View>

        {/* CÓMO EMPEZAR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo empezar</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.howToText}>{optA.howToStart}</Text>
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              <Text style={styles.howToText}>{optB.howToStart}</Text>
            </View>
          </View>
        </View>

        {/* VEREDICTO */}
        <View style={styles.verdictCard}>
          <Text style={styles.verdictTitle}>Resumen</Text>
          <Text style={styles.verdictText}>
            {betterRate === 'a' ? `📈 ${optA.institution}` : `📈 ${optB.institution}`} ofrece mejor tasa.{'\n'}
            {betterRisk === 'a' ? `🛡️ ${optA.institution}` : `🛡️ ${optB.institution}`} tiene menor riesgo.{'\n'}
            {betterLiquidity === 'a' ? `⚡ ${optA.institution}` : `⚡ ${optB.institution}`} da más liquidez.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          {optA.websiteUrl && (
            <TouchableOpacity style={styles.ctaBtn} onPress={() => Linking.openURL(optA.websiteUrl!)}>
              <Text style={styles.ctaBtnText}>{optA.institution} →</Text>
            </TouchableOpacity>
          )}
          {optB.websiteUrl && (
            <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnB]} onPress={() => Linking.openURL(optB.websiteUrl!)}>
              <Text style={styles.ctaBtnText}>{optB.institution} →</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, valA, valB, winner, colorA, colorB, sizeA = 15, sizeB = 15 }: {
  label: string; valA: string; valB: string; winner: 'a' | 'b';
  colorA: string; colorB: string; sizeA?: number; sizeB?: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowColA}>
        <Text style={[styles.rowVal, { color: colorA, fontSize: sizeA }, winner === 'a' && styles.winner]}>{valA}</Text>
        {winner === 'a' && <Text style={styles.winnerBadge}>✓ Mejor</Text>}
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <View style={styles.rowColB}>
        <Text style={[styles.rowVal, styles.rowValRight, { color: colorB, fontSize: sizeB }, winner === 'b' && styles.winner]}>{valB}</Text>
        {winner === 'b' && <Text style={[styles.winnerBadge, styles.winnerBadgeRight]}>✓ Mejor</Text>}
      </View>
    </View>
  );
}

function BulletItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color }]}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  header: { flexDirection: 'row', backgroundColor: Colors.primary, padding: 16, alignItems: 'center' },
  headerCol: { flex: 1 },
  headerColRight: { alignItems: 'flex-end' },
  headerInstitution: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerName: { fontSize: 14, fontWeight: '800', color: '#FFF', marginTop: 2 },
  headerDivider: { width: 36, alignItems: 'center' },
  vsText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.4)' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  rowColA: { flex: 1, alignItems: 'flex-start' },
  rowColB: { flex: 1, alignItems: 'flex-end' },
  rowLabel: { width: 90, alignItems: 'center' },
  rowLabelText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', textAlign: 'center' },
  rowVal: { fontWeight: '700', color: Colors.textPrimary },
  rowValRight: { textAlign: 'right' },
  winner: { fontWeight: '900' },
  winnerBadge: { fontSize: 10, color: Colors.accent, fontWeight: '700', marginTop: 2 },
  winnerBadgeRight: { textAlign: 'right' },

  section: { backgroundColor: Colors.surface, marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  colDivider: { width: 1, backgroundColor: Colors.border },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  bullet: { fontSize: 14, marginTop: 1 },
  bulletText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, flex: 1 },
  howToText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  verdictCard: { backgroundColor: Colors.primary, margin: 16, borderRadius: 16, padding: 16 },
  verdictTitle: { fontSize: 14, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  verdictText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },

  ctaRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  ctaBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  ctaBtnB: { backgroundColor: Colors.primaryLight },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
