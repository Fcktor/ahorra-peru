import {
  View, Text, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';

const MAX_RATE = 13;

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: Colors.riskBajo,
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

const RISK_LABELS: Record<string, string> = {
  'muy bajo': 'Muy bajo',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

const sorted = [...SAVINGS_OPTIONS].sort((a, b) => b.rateMax - a.rateMax);

export default function HistorialScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.title}>Ranking de tasas</Text>
          <Text style={styles.subtitle}>Rendimiento anual por producto de ahorro en Perú</Text>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Riesgo</Text>
          <View style={styles.legendRow}>
            {Object.entries(RISK_LABELS).map(([key, label]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: RISK_COLORS[key] }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartBlock}>
          <View style={styles.chartScaleRow}>
            {[0, 3, 6, 9, 12].map((v) => (
              <Text key={v} style={[styles.scaleLabel, { left: `${(v / MAX_RATE) * 100}%` as any }]}>
                {v}%
              </Text>
            ))}
          </View>

          {sorted.map((opt, i) => {
            const barMin = (opt.rateMin / MAX_RATE) * 100;
            const barExt = ((opt.rateMax - opt.rateMin) / MAX_RATE) * 100;
            const color = RISK_COLORS[opt.risk];

            return (
              <View key={opt.id} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
                <View style={styles.rowLabel}>
                  <Text style={styles.rowInstitution} numberOfLines={1}>{opt.institution}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>{opt.name}</Text>
                </View>
                <View style={styles.barContainer}>
                  {[3, 6, 9, 12].map((v) => (
                    <View
                      key={v}
                      style={[styles.gridLine, { left: `${(v / MAX_RATE) * 100}%` as any }]}
                    />
                  ))}
                  <View style={[styles.barBase, { width: `${barMin}%`, backgroundColor: color, opacity: 0.3 }]} />
                  <View style={[styles.barExt, { left: `${barMin}%`, width: `${barExt}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rateText, { color }]}>
                    {opt.rateMin === opt.rateMax ? `${opt.rateMin}%` : `${opt.rateMin}–${opt.rateMax}%`}
                  </Text>
                  {opt.rateLabel && <Text style={styles.rateLabel}>{opt.rateLabel}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.notes}>
          <Text style={styles.notesTitle}>¿Cómo leer este gráfico?</Text>
          <Text style={styles.notesText}>
            • La barra clara muestra la tasa mínima; la parte sólida el rango hasta la máxima.{'\n'}
            • Las tasas TREA son anuales, expresadas en soles (PEN).{'\n'}
            • Los fondos mutuos y AFP muestran rendimiento estimado/histórico, no garantizado.{'\n'}
            • Fuente: SBS, portales de instituciones — datos curados manualmente.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Qué es la TREA?</Text>
          <Text style={styles.infoText}>
            Tasa de Rendimiento Efectiva Anual — lo que realmente ganas en un año, incluyendo capitalización de intereses y descontando comisiones. Es la métrica más honesta para comparar productos de ahorro.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  header: {
    backgroundColor: Colors.surfaceHigh,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },

  legend: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendTitle: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

  chartBlock: { backgroundColor: Colors.surface, marginTop: 8, paddingBottom: 8 },

  chartScaleRow: {
    position: 'relative',
    height: 20,
    marginLeft: 110,
    marginRight: 68,
    marginTop: 8,
    marginBottom: 4,
  },
  scaleLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    transform: [{ translateX: -10 }],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 54,
  },
  rowAlt: { backgroundColor: Colors.surfaceHigh },

  rowLabel: { width: 98, paddingRight: 8 },
  rowInstitution: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  rowName: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 1 },

  barContainer: {
    flex: 1,
    height: 18,
    position: 'relative',
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  barBase: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  barExt: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },

  rowRight: { width: 62, paddingLeft: 8, alignItems: 'flex-end' },
  rateText: { fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
  rateLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'right' },

  notes: { backgroundColor: Colors.surface, marginTop: 8, padding: 16 },
  notesTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  notesText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20 },

  infoCard: {
    backgroundColor: Colors.surfaceHigh,
    margin: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary, marginBottom: 6 },
  infoText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20 },
});
