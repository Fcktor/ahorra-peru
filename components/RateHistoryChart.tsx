import { View, Text, StyleSheet, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { RATE_HISTORY, RATE_HISTORY_SOURCE, RateHistoryPoint } from '@/constants/rateHistory';

interface SeriesConfig {
  key: keyof Pick<RateHistoryPoint, 'ahorro' | 'plazoFijo'>;
  label: string;
  color: string;
}

const SERIES: SeriesConfig[] = [
  { key: 'plazoFijo', label: 'Depósito a Plazo (>360 días)', color: Colors.primary },
  { key: 'ahorro', label: 'Cuenta de Ahorros', color: Colors.riskBajo },
];

const CHART_HEIGHT = 120;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;
const PADDING_X = 5;

function MiniLineChart({ series }: { series: SeriesConfig }) {
  const [width, setWidth] = useState(0);
  const values = RATE_HISTORY.map((p) => p[series.key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const innerWidth = Math.max(width - PADDING_X * 2, 0);
  const points = RATE_HISTORY.map((p, i) => {
    const x = width > 0 ? PADDING_X + (i / (RATE_HISTORY.length - 1)) * innerWidth : 0;
    const y = PADDING_TOP + innerHeight - ((p[series.key] - min) / range) * innerHeight;
    return { x, y, value: p[series.key], quarter: p.quarter };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.dot, { backgroundColor: series.color }]} />
          <Text style={styles.chartTitle}>{series.label}</Text>
        </View>
        {last && <Text style={[styles.chartCurrent, { color: series.color }]}>{last.value.toFixed(2)}%</Text>}
      </View>

      <View onLayout={onLayout} style={{ height: CHART_HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line
              x1={0} y1={PADDING_TOP + innerHeight} x2={width} y2={PADDING_TOP + innerHeight}
              stroke={Colors.border} strokeWidth={1}
            />
            <Line
              x1={0} y1={PADDING_TOP} x2={width} y2={PADDING_TOP}
              stroke={Colors.border} strokeWidth={1} strokeDasharray="2,4"
            />
            <Path d={linePath} stroke={series.color} strokeWidth={2} fill="none" />
            {points.map((pt, i) => (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={i === points.length - 1 ? 4 : 2.5}
                fill={i === points.length - 1 ? series.color : Colors.background}
                stroke={series.color}
                strokeWidth={1.5}
              />
            ))}
            <SvgText x={2} y={PADDING_TOP - 4} fill={Colors.textSecondary} fontSize={9}>
              {max.toFixed(2)}%
            </SvgText>
            <SvgText x={2} y={PADDING_TOP + innerHeight + 12} fill={Colors.textSecondary} fontSize={9}>
              {min.toFixed(2)}%
            </SvgText>
          </Svg>
        )}
      </View>

      <View style={styles.axisRow}>
        {RATE_HISTORY.map((p, i) => (
          <Text
            key={p.quarter}
            style={[styles.axisLabel, i % 3 !== 0 && i !== RATE_HISTORY.length - 1 && styles.axisLabelHidden]}
          >
            {p.quarter}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function RateHistoryChart() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolución histórica</Text>
      <Text style={styles.subtitle}>Tasa promedio del sistema bancario, últimos 3 años (trimestral)</Text>

      {SERIES.map((s) => (
        <MiniLineChart key={s.key} series={s} />
      ))}

      <Text style={styles.source}>Fuente: {RATE_HISTORY_SOURCE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 16, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary },
  subtitle: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chartTitle: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  chartCurrent: { fontSize: 14, fontFamily: 'Archivo_800ExtraBold' },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisLabel: { fontSize: 9, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },
  axisLabelHidden: { opacity: 0 },

  source: { fontSize: 10, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
});
