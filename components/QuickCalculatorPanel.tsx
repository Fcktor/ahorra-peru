import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { SavingsOption } from '@/constants/savings';
import { calcInterest } from '@/lib/interestMath';

const ON_DARK_TEXT = '#EAF6EE';
const ON_DARK_MUTED = '#A9D9BE';
const SPARKLINE_COLOR = '#8FE3B0';

const TERM_PRESETS = [
  { label: '6 m', months: 6 },
  { label: '1 año', months: 12 },
  { label: '3 años', months: 36 },
  { label: '5 años', months: 60 },
];

const fmt = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

interface Props {
  product: SavingsOption;
}

export default function QuickCalculatorPanel({ product }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState('10000');
  const [months, setMonths] = useState(12);

  const rate = (product.rateMin + product.rateMax) / 2;
  const ratePercent = Math.min(100, Math.max(0, (rate / 13) * 100));

  const result = useMemo(
    () => calcInterest(parseFloat(amount) || 0, rate, months, true, 0),
    [amount, rate, months],
  );

  const yearsLabel = months >= 12 ? `${Math.round(months / 12)} año${months >= 24 ? 's' : ''}` : `${months} meses`;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Simula tu ganancia</Text>
      <Text style={styles.subtitle}>Ajusta y compara al instante</Text>

      <Text style={styles.label}>Monto a invertir</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currency}>S/</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <Text style={styles.label}>Plazo</Text>
      <View style={styles.presets}>
        {TERM_PRESETS.map((p) => (
          <TouchableOpacity
            key={p.months}
            style={[styles.preset, months === p.months && styles.presetActive]}
            onPress={() => setMonths(p.months)}
          >
            <Text style={[styles.presetText, months === p.months && styles.presetTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Tasa TREA · <Text style={{ color: Colors.primary }}>{product.institution}</Text></Text>
      <View style={styles.sliderRow}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${ratePercent}%` as any }]} />
          <View style={[styles.sliderThumb, { left: `${ratePercent}%` as any }]} />
        </View>
        <Text style={styles.rateValue}>{rate.toFixed(1)}%</Text>
      </View>

      {result && (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.35, y: 1 }}
          style={styles.resultCard}
        >
          <Text style={styles.resultLabel}>EN {yearsLabel.toUpperCase()} TENDRÁS</Text>
          <Text style={styles.resultAmount}>{fmt(result.total)}</Text>

          <Svg viewBox="0 0 260 50" preserveAspectRatio="none" style={{ width: '100%', height: 44, marginTop: 8 }}>
            <Defs>
              <SvgLinearGradient id="qcpFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={SPARKLINE_COLOR} stopOpacity={0.45} />
                <Stop offset="1" stopColor={SPARKLINE_COLOR} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Path d="M0,44 C50,40 90,32 140,22 C190,14 230,8 260,4 L260,50 L0,50 Z" fill="url(#qcpFill)" />
            <Path d="M0,44 C50,40 90,32 140,22 C190,14 230,8 260,4" fill="none" stroke={SPARKLINE_COLOR} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>

          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <View>
              <Text style={styles.resultRowLabel}>Capital</Text>
              <Text style={styles.resultRowValue}>{fmt(parseFloat(amount) || 0)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.resultRowLabel}>Intereses</Text>
              <Text style={[styles.resultRowValue, { color: SPARKLINE_COLOR }]}>+{fmt(result.ganancia)}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <TouchableOpacity style={styles.cta} onPress={() => router.push({ pathname: '/detalle', params: { id: product.id } })}>
        <Text style={styles.ctaText}>Abrir esta cuenta →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 352,
    flexShrink: 0,
    backgroundColor: '#EFEBDF',
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: 24,
  },
  title: { fontFamily: 'Archivo_800ExtraBold', fontSize: 19, color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: '#7A8178', marginTop: 4, marginBottom: 18 },
  label: { fontSize: 12.5, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginTop: 14, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12,
  },
  currency: { fontFamily: 'Archivo_800ExtraBold', fontSize: 17, color: Colors.textMuted },
  input: { flex: 1, fontFamily: 'Archivo_800ExtraBold', fontSize: 22, color: Colors.textPrimary, padding: 0 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  preset: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  presetActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  presetText: { fontSize: 12.5, fontFamily: 'Figtree_600SemiBold', color: '#4B5A52' },
  presetTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: '#DED9C9', position: 'relative' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: Colors.primary },
  sliderThumb: {
    position: 'absolute', top: '50%', width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#fff',
    marginLeft: -9, marginTop: -9,
  },
  rateValue: { fontFamily: 'Archivo_800ExtraBold', fontSize: 17, color: Colors.textPrimary },

  resultCard: { marginTop: 20, borderRadius: 20, padding: 20 },
  resultLabel: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: ON_DARK_MUTED, letterSpacing: 1 },
  resultAmount: { fontFamily: 'Archivo_800ExtraBold', fontSize: 30, color: ON_DARK_TEXT, marginTop: 4, letterSpacing: -0.8 },
  resultDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 4, marginTop: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  resultRowLabel: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: ON_DARK_MUTED },
  resultRowValue: { fontFamily: 'Archivo_800ExtraBold', fontSize: 15, color: ON_DARK_TEXT, marginTop: 1 },

  cta: { marginTop: 14, backgroundColor: Colors.textPrimary, borderRadius: 14, padding: 14, alignItems: 'center' },
  ctaText: { fontFamily: 'Archivo_800ExtraBold', fontSize: 14, color: Colors.background },
});
