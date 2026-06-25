import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Colors } from '@/constants/colors';

const PRESETS = [
  { label: '1 mes', months: 1 },
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '1 año', months: 12 },
  { label: '3 años', months: 36 },
  { label: '5 años', months: 60 },
];

export default function CalculadoraScreen() {
  const [capital, setCapital] = useState('10000');
  const [trea, setTrea] = useState('8');
  const [months, setMonths] = useState(12);
  const [compound, setCompound] = useState(true);

  const result = useMemo(() => {
    const P = parseFloat(capital) || 0;
    const r = (parseFloat(trea) || 0) / 100;
    const t = months / 12;

    if (P <= 0 || r <= 0) return null;

    const total = compound
      ? P * Math.pow(1 + r, t)
      : P * (1 + r * t);

    const ganancia = total - P;
    const tasaReal = r - 0.035; // estimando inflación promedio ~3.5%
    const totalReal = P * Math.pow(1 + tasaReal, t);
    const gananciaReal = totalReal - P;

    return { total, ganancia, totalReal, gananciaReal };
  }, [capital, trea, months, compound]);

  const fmt = (n: number) =>
    'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Calculadora de Intereses</Text>
        <Text style={styles.subtitle}>
          Simula cuánto ganarás según el tipo de ahorro
        </Text>

        <View style={styles.card}>
          <Label text="¿Cuánto tienes para invertir? (S/)" />
          <TextInput
            style={styles.input}
            value={capital}
            onChangeText={setCapital}
            keyboardType="numeric"
            placeholder="Ej: 5000"
            placeholderTextColor={Colors.textMuted}
          />

          <Label text="Tasa anual (TREA %)" />
          <TextInput
            style={styles.input}
            value={trea}
            onChangeText={setTrea}
            keyboardType="numeric"
            placeholder="Ej: 8"
            placeholderTextColor={Colors.textMuted}
          />

          <Label text="Plazo" />
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.months}
                style={[styles.preset, months === p.months && styles.presetActive]}
                onPress={() => setMonths(p.months)}
              >
                <Text style={[styles.presetText, months === p.months && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Interés compuesto</Text>
            <TouchableOpacity
              style={[styles.toggle, compound && styles.toggleOn]}
              onPress={() => setCompound(!compound)}
            >
              <View style={[styles.toggleThumb, compound && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.switchHint}>
            {compound
              ? 'Los intereses que ganas también generan intereses'
              : 'Los intereses no se reinvierten (interés simple)'}
          </Text>
        </View>

        {result && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Resultado</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Capital inicial</Text>
              <Text style={styles.resultValue}>{fmt(parseFloat(capital))}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Intereses ganados</Text>
              <Text style={[styles.resultValue, { color: Colors.accent }]}>
                +{fmt(result.ganancia)}
              </Text>
            </View>
            <View style={[styles.resultRow, styles.resultTotal]}>
              <Text style={styles.resultTotalLabel}>Total final</Text>
              <Text style={styles.resultTotalValue}>{fmt(result.total)}</Text>
            </View>

            <View style={styles.separator} />

            <Text style={styles.realLabel}>📉 Considerando inflación (~3.5% anual)</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Ganancia real</Text>
              <Text
                style={[
                  styles.resultValue,
                  { color: result.gananciaReal >= 0 ? Colors.accent : Colors.danger },
                ]}
              >
                {result.gananciaReal >= 0 ? '+' : ''}{fmt(result.gananciaReal)}
              </Text>
            </View>
            {result.gananciaReal < 0 && (
              <Text style={styles.warning}>
                ⚠️ Con esta tasa pierdes poder adquisitivo frente a la inflación.
                Busca opciones por encima del 3.5% para al menos mantener el valor de tu dinero.
              </Text>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Qué es la TREA?</Text>
          <Text style={styles.infoText}>
            La TREA (Tasa de Rendimiento Efectivo Anual) es el porcentaje real que ganas al año.
            Ya incluye la capitalización de intereses. Es el número que debes comparar entre bancos
            y fondos mutuos — no te dejes engañar por tasas nominales más bajas.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  presetText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  presetTextActive: { color: '#FFF', fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.border, justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: Colors.accent },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  switchHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent + '40',
  },
  resultsTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultLabel: { fontSize: 14, color: Colors.textSecondary },
  resultValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  resultTotal: { marginTop: 4 },
  resultTotalLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  resultTotalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  realLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  warning: { fontSize: 12, color: Colors.danger, marginTop: 6, lineHeight: 18 },
  infoCard: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
