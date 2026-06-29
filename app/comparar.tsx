import {
  View, Text, StyleSheet,
  ScrollView, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const RISK_ORDER = ['muy bajo', 'bajo', 'medio', 'alto'];
const LIQUIDITY_ORDER = ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'];

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: '#5DADE2',
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

export default function CompararScreen() {
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
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
  const betterRisk = RISK_ORDER.indexOf(optA.risk) <= RISK_ORDER.indexOf(optB.risk) ? 'a' : 'b';
  const betterLiquidity = LIQUIDITY_ORDER.indexOf(optA.liquidity) <= LIQUIDITY_ORDER.indexOf(optB.liquidity) ? 'a' : 'b';
  const betterMin = optA.minAmount <= optB.minAmount ? 'a' : 'b';

  const scoreA = [betterRate, betterRisk, betterLiquidity, betterMin].filter((w) => w === 'a').length;
  const scoreB = 4 - scoreA;
  const overallWinner = scoreA > scoreB ? optA.institution : scoreB > scoreA ? optB.institution : null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Comparar', headerBackTitle: 'Volver', headerTintColor: Colors.primary }} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* CABECERA */}
        <View style={styles.header}>
          <View style={styles.headerCol}>
            <Text style={styles.headerInstitution}>{optA.institution}</Text>
            <Text style={styles.headerName}>{optA.name}</Text>
            <View style={styles.scoreChip}>
              <Text style={styles.scoreNum}>{scoreA}</Text>
              <Text style={styles.scoreLabel}> pts</Text>
            </View>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.headerCol, styles.headerColRight]}>
            <Text style={[styles.headerInstitution, { textAlign: 'right' }]}>{optB.institution}</Text>
            <Text style={[styles.headerName, { textAlign: 'right' }]}>{optB.name}</Text>
            <View style={[styles.scoreChip, styles.scoreChipRight]}>
              <Text style={styles.scoreNum}>{scoreB}</Text>
              <Text style={styles.scoreLabel}> pts</Text>
            </View>
          </View>
        </View>

        {/* GANADOR GENERAL */}
        {overallWinner ? (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerBannerText}>🏆 {overallWinner} gana en más criterios</Text>
          </View>
        ) : (
          <View style={[styles.winnerBanner, styles.tieBanner]}>
            <Text style={styles.winnerBannerText}>⚖️ Empate — ambas opciones son equivalentes</Text>
          </View>
        )}

        {/* CRITERIOS */}
        <View style={styles.criteriaBlock}>
          <Text style={styles.blockTitle}>Criterios clave</Text>
          <CompareRow
            label="TREA anual"
            valA={rateA}
            valB={rateB}
            winner={betterRate}
            colorA={Colors.accent}
            colorB={Colors.accent}
            sizeA={22}
            sizeB={22}
          />
          <CompareRow
            label="Riesgo"
            valA={optA.risk}
            valB={optB.risk}
            winner={betterRisk}
            colorA={RISK_COLORS[optA.risk]}
            colorB={RISK_COLORS[optB.risk]}
          />
          <CompareRow
            label="Liquidez"
            valA={optA.liquidity}
            valB={optB.liquidity}
            winner={betterLiquidity}
            colorA={Colors.primaryLight}
            colorB={Colors.primaryLight}
          />
          <CompareRow
            label="Mínimo"
            valA={optA.minAmount > 0 ? `S/ ${optA.minAmount.toLocaleString()}` : 'Sin mínimo'}
            valB={optB.minAmount > 0 ? `S/ ${optB.minAmount.toLocaleString()}` : 'Sin mínimo'}
            winner={betterMin}
            colorA={Colors.textPrimary}
            colorB={Colors.textPrimary}
          />
        </View>

        {/* PROS */}
        <View style={styles.section}>
          <Text style={styles.blockTitle}>Ventajas</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.colHeader}>{optA.institution}</Text>
              {optA.pros.map((p, i) => <BulletItem key={i} text={p} color={Colors.accent} />)}
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              <Text style={[styles.colHeader, { textAlign: 'right' }]}>{optB.institution}</Text>
              {optB.pros.map((p, i) => <BulletItem key={i} text={p} color={Colors.accent} />)}
            </View>
          </View>
        </View>

        {/* CONTRAS */}
        <View style={styles.section}>
          <Text style={styles.blockTitle}>Desventajas</Text>
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
          <Text style={styles.blockTitle}>Cómo empezar</Text>
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
          <Text style={styles.verdictTitle}>Resumen del comparativo</Text>
          <VerdictRow icon="📈" label="Mejor tasa" winner={betterRate === 'a' ? optA.institution : optB.institution} />
          <VerdictRow icon="🛡️" label="Menor riesgo" winner={betterRisk === 'a' ? optA.institution : optB.institution} />
          <VerdictRow icon="⚡" label="Mejor liquidez" winner={betterLiquidity === 'a' ? optA.institution : optB.institution} />
          <VerdictRow icon="💰" label="Menor mínimo" winner={betterMin === 'a' ? optA.institution : optB.institution} />
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

function CompareRow({ label, valA, valB, winner, colorA, colorB, sizeA = 14, sizeB = 14 }: {
  label: string; valA: string; valB: string; winner: 'a' | 'b';
  colorA: string; colorB: string; sizeA?: number; sizeB?: number;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowSide, winner === 'a' && styles.rowWinnerBg]}>
        <Text style={[styles.rowVal, { color: colorA, fontSize: sizeA, fontWeight: winner === 'a' ? '900' : '600' }]}>
          {valA}
        </Text>
        {winner === 'a' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Mejor</Text>
          </View>
        )}
      </View>
      <View style={styles.rowCenter}>
        <Text style={styles.rowCenterText}>{label}</Text>
      </View>
      <View style={[styles.rowSide, styles.rowSideRight, winner === 'b' && styles.rowWinnerBg]}>
        {winner === 'b' && (
          <View style={[styles.badge, styles.badgeRight]}>
            <Text style={styles.badgeText}>Mejor ✓</Text>
          </View>
        )}
        <Text style={[styles.rowVal, { color: colorB, fontSize: sizeB, fontWeight: winner === 'b' ? '900' : '600', textAlign: 'right' }]}>
          {valB}
        </Text>
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

function VerdictRow({ icon, label, winner }: { icon: string; label: string; winner: string }) {
  return (
    <View style={styles.verdictRow}>
      <Text style={styles.verdictIcon}>{icon}</Text>
      <Text style={styles.verdictLabel}>{label}:</Text>
      <Text style={styles.verdictWinner}>{winner}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 48 },

  /* Header */
  header: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 16,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  headerCol: { flex: 1 },
  headerColRight: { alignItems: 'flex-end' },
  headerInstitution: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerName: { fontSize: 13, fontWeight: '800', color: '#FFF', marginTop: 3, lineHeight: 18 },
  headerCenter: { width: 40, alignItems: 'center', paddingTop: 6 },
  vsText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  scoreChipRight: { alignSelf: 'flex-end' },
  scoreNum: { fontSize: 20, fontWeight: '900', color: Colors.accent },
  scoreLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  /* Winner banner */
  winnerBanner: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tieBanner: { backgroundColor: Colors.primaryLight },
  winnerBannerText: { fontSize: 13, fontWeight: '800', color: '#FFF' },

  /* Criteria block */
  criteriaBlock: { backgroundColor: Colors.surface, marginTop: 8 },
  blockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },

  /* Row */
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 64,
  },
  rowSide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowSideRight: { alignItems: 'flex-end' },
  rowWinnerBg: { backgroundColor: 'rgba(22, 196, 127, 0.08)' },
  rowCenter: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
  },
  rowCenterText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rowVal: { color: Colors.textPrimary },
  badge: {
    marginTop: 4,
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeRight: { alignSelf: 'flex-end' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  /* Sections */
  section: { backgroundColor: Colors.surface, marginTop: 8, padding: 16 },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  colDivider: { width: 1, backgroundColor: Colors.border },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  bullet: { fontSize: 14, marginTop: 1 },
  bulletText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, flex: 1 },
  howToText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  /* Verdict */
  verdictCard: {
    backgroundColor: Colors.primary,
    margin: 16,
    borderRadius: 16,
    padding: 18,
  },
  verdictTitle: { fontSize: 13, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verdictIcon: { fontSize: 16 },
  verdictLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1 },
  verdictWinner: { fontSize: 13, fontWeight: '800', color: Colors.accent },

  /* CTAs */
  ctaRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  ctaBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  ctaBtnB: { backgroundColor: Colors.primaryLight },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
