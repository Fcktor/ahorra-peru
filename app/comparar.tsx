import {
  View, Text, StyleSheet,
  ScrollView, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const ON_DARK_TEXT = '#EAF6EE';
const ON_DARK_MUTED = '#A9D9BE';

const RISK_ORDER = ['muy bajo', 'bajo', 'medio', 'alto'];
const LIQUIDITY_ORDER = ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'];

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: Colors.riskBajo,
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
        <Text style={{ padding: 20, fontFamily: 'Figtree_400Regular', color: Colors.danger }}>Opciones no encontradas.</Text>
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

        {/* HERO: cabecera + veredicto en una sola tarjeta con gradiente */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroCol}>
                <Text style={styles.heroInstitution}>{optA.institution}</Text>
                <Text style={styles.heroName}>{optA.name}</Text>
                <View style={[styles.heroScoreChip, scoreA > scoreB && styles.heroScoreChipWinner]}>
                  <Text style={styles.heroScoreNum}>{scoreA}</Text>
                  <Text style={styles.heroScoreLabel}> pts</Text>
                  {scoreA > scoreB && <Text style={styles.heroTrophy}> 🏆</Text>}
                </View>
              </View>

              <View style={styles.heroVsBadge}>
                <Text style={styles.heroVsText}>VS</Text>
              </View>

              <View style={[styles.heroCol, styles.heroColRight]}>
                <Text style={[styles.heroInstitution, styles.heroTextRight]}>{optB.institution}</Text>
                <Text style={[styles.heroName, styles.heroTextRight]}>{optB.name}</Text>
                <View style={[styles.heroScoreChip, styles.heroScoreChipRight, scoreB > scoreA && styles.heroScoreChipWinner]}>
                  {scoreB > scoreA && <Text style={styles.heroTrophy}>🏆 </Text>}
                  <Text style={styles.heroScoreNum}>{scoreB}</Text>
                  <Text style={styles.heroScoreLabel}> pts</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroVerdict}>
              <Text style={styles.heroVerdictText}>
                {overallWinner ? `🏆 ${overallWinner} gana en más criterios` : '⚖️ Empate — ambas opciones son equivalentes'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* CRITERIOS */}
        <View style={styles.criteriaBlock}>
          <Text style={styles.blockTitle}>Criterios clave</Text>
          <CompareRow label="TREA anual" valA={rateA} valB={rateB} winner={betterRate} colorA={Colors.primary} colorB={Colors.primary} sizeA={22} sizeB={22} />
          <CompareRow label="Riesgo" valA={optA.risk} valB={optB.risk} winner={betterRisk} colorA={RISK_COLORS[optA.risk]} colorB={RISK_COLORS[optB.risk]} />
          <CompareRow label="Liquidez" valA={optA.liquidity} valB={optB.liquidity} winner={betterLiquidity} colorA={Colors.riskBajo} colorB={Colors.riskBajo} />
          <CompareRow
            label="Mínimo"
            valA={optA.minAmount > 0 ? `S/ ${optA.minAmount.toLocaleString()}` : 'Sin mínimo'}
            valB={optB.minAmount > 0 ? `S/ ${optB.minAmount.toLocaleString()}` : 'Sin mínimo'}
            winner={betterMin}
            colorA={Colors.textPrimary}
            colorB={Colors.textPrimary}
          />
        </View>

        {/* VENTAJAS */}
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

        {/* DESVENTAJAS */}
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
              <Text style={[styles.ctaBtnText, styles.ctaBtnTextB]}>{optB.institution} →</Text>
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
        <Text style={[styles.rowVal, { color: colorA, fontSize: sizeA, fontFamily: winner === 'a' ? 'Archivo_800ExtraBold' : 'Figtree_600SemiBold' }]}>
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
        <Text style={[styles.rowVal, { color: colorB, fontSize: sizeB, fontFamily: winner === 'b' ? 'Archivo_800ExtraBold' : 'Figtree_600SemiBold', textAlign: 'right' }]}>
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

  heroWrap: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 24, overflow: 'hidden' },
  hero: { paddingTop: 22 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 18, gap: 10 },
  heroCol: { flex: 1 },
  heroColRight: { alignItems: 'flex-end' },
  heroTextRight: { textAlign: 'right' },
  heroInstitution: {
    fontSize: 10,
    fontFamily: 'Figtree_600SemiBold',
    color: ON_DARK_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroName: { fontSize: 14, fontFamily: 'Archivo_800ExtraBold', color: ON_DARK_TEXT, marginTop: 4, lineHeight: 19 },
  heroVsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroVsText: { fontSize: 11, fontFamily: 'Archivo_800ExtraBold', color: '#fff', letterSpacing: 0.5 },
  heroScoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroScoreChipRight: { alignSelf: 'flex-end' },
  heroScoreChipWinner: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: '#fff' },
  heroScoreNum: { fontSize: 20, fontFamily: 'Archivo_800ExtraBold', color: '#fff' },
  heroScoreLabel: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: ON_DARK_MUTED },
  heroTrophy: { fontSize: 13 },
  heroVerdict: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  heroVerdictText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: '#fff', textAlign: 'center' },

  criteriaBlock: { backgroundColor: Colors.surface, marginTop: 8 },
  blockTitle: {
    fontSize: 10,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },

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
  rowWinnerBg: { backgroundColor: Colors.primary + '10' },
  rowCenter: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
  },
  rowCenterText: {
    fontSize: 10,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rowVal: { color: Colors.textPrimary },
  badge: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeRight: { alignSelf: 'flex-end' },
  badgeText: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.background },

  section: { backgroundColor: Colors.surface, marginTop: 8, padding: 16 },
  colHeader: {
    fontSize: 10,
    fontFamily: 'Figtree_700Bold',
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
  bulletText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 18, flex: 1 },
  howToText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  verdictCard: {
    backgroundColor: Colors.surfaceHigh,
    margin: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  verdictTitle: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  verdictIcon: { fontSize: 16 },
  verdictLabel: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flex: 1 },
  verdictWinner: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.primary },

  ctaRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  ctaBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  ctaBtnB: { backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.primary },
  ctaBtnText: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.background },
  ctaBtnTextB: { color: Colors.primary },
});
