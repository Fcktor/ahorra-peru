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

const GOAL_PRESETS = [
  { label: '6 meses', months: 6 },
  { label: '1 año', months: 12 },
  { label: '2 años', months: 24 },
  { label: '3 años', months: 36 },
  { label: '5 años', months: 60 },
];

function getRecommendation(months: number): { where: string; trea: number; tip: string } {
  if (months <= 3)
    return { where: 'Cuenta de ahorros (BCP, Interbank)', trea: 2, tip: 'Plazo muy corto: prioriza liquidez sobre rentabilidad.' };
  if (months <= 6)
    return { where: 'Depósito a plazo 90-180 días (BCP o Interbank)', trea: 7.5, tip: 'Tasa garantizada, sin riesgo. Ideal para este plazo.' };
  if (months <= 12)
    return { where: 'Depósito a plazo (CMAC Arequipa o Piura)', trea: 10, tip: 'Las cajas municipales dan las mejores tasas para 6-12 meses.' };
  if (months <= 36)
    return { where: 'CMAC ladder + Fondo mutuo conservador', trea: 9, tip: 'Mezcla depósitos escalonados con un fondo conservador para maximizar sin mucho riesgo.' };
  return { where: 'Fondo mutuo moderado (Interfondos o SURA)', trea: 10.5, tip: 'A más de 3 años, el interés compuesto en fondos moderados supera a los depósitos.' };
}

const fmt = (n: number) =>
  'S/ ' + Math.round(n).toLocaleString('es-PE');

const fmt2 = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CalculadoraScreen() {
  const [mode, setMode] = useState<'interes' | 'meta'>('interes');

  // Modo interés
  const [capital, setCapital] = useState('10000');
  const [trea, setTrea] = useState('8');
  const [months, setMonths] = useState(12);
  const [compound, setCompound] = useState(true);

  // Modo meta
  const [meta, setMeta] = useState('20000');
  const [ahorroActual, setAhorroActual] = useState('0');
  const [goalMonths, setGoalMonths] = useState(24);

  const interesResult = useMemo(() => {
    const P = parseFloat(capital) || 0;
    const r = (parseFloat(trea) || 0) / 100;
    const t = months / 12;
    if (P <= 0 || r <= 0) return null;
    const total = compound ? P * Math.pow(1 + r, t) : P * (1 + r * t);
    const ganancia = total - P;
    const tasaReal = r - 0.035;
    const totalReal = P * Math.pow(1 + tasaReal, t);
    const gananciaReal = totalReal - P;
    return { total, ganancia, totalReal, gananciaReal };
  }, [capital, trea, months, compound]);

  const metaResult = useMemo(() => {
    const FV = parseFloat(meta) || 0;
    const PV = parseFloat(ahorroActual) || 0;
    const n = goalMonths;
    if (FV <= 0 || n <= 0) return null;

    const rec = getRecommendation(n);
    const r = rec.trea / 100 / 12;

    // Valor futuro del ahorro actual
    const pvFuture = PV * Math.pow(1 + r, n);
    const remaining = Math.max(0, FV - pvFuture);

    // PMT para llegar al restante
    let pmt: number;
    if (r === 0) {
      pmt = remaining / n;
    } else {
      pmt = remaining * r / (Math.pow(1 + r, n) - 1);
    }

    const totalAportado = pmt * n + PV;
    const totalIntereses = FV - totalAportado;
    const progress = Math.min(100, (PV / FV) * 100);

    return { pmt, totalAportado, totalIntereses, rec, pvFuture, remaining, progress };
  }, [meta, ahorroActual, goalMonths]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Calculadora</Text>

        {/* MODE TOGGLE */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'interes' && styles.modeBtnActive]}
            onPress={() => setMode('interes')}
          >
            <Text style={[styles.modeBtnText, mode === 'interes' && styles.modeBtnTextActive]}>
              ¿Cuánto ganaré?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'meta' && styles.modeBtnActive]}
            onPress={() => setMode('meta')}
          >
            <Text style={[styles.modeBtnText, mode === 'meta' && styles.modeBtnTextActive]}>
              ¿Cómo llego a mi meta?
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODO INTERÉS */}
        {mode === 'interes' && (
          <>
            <Text style={styles.subtitle}>Simula cuánto ganarás según el tipo de ahorro</Text>
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

            {interesResult && (
              <View style={styles.resultsCard}>
                <Text style={styles.resultsTitle}>Resultado</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Capital inicial</Text>
                  <Text style={styles.resultValue}>{fmt2(parseFloat(capital))}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Intereses ganados</Text>
                  <Text style={[styles.resultValue, { color: Colors.accent }]}>
                    +{fmt2(interesResult.ganancia)}
                  </Text>
                </View>
                <View style={[styles.resultRow, styles.resultTotal]}>
                  <Text style={styles.resultTotalLabel}>Total final</Text>
                  <Text style={styles.resultTotalValue}>{fmt2(interesResult.total)}</Text>
                </View>
                <View style={styles.separator} />
                <Text style={styles.realLabel}>📉 Considerando inflación (~3.5% anual)</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Ganancia real</Text>
                  <Text style={[styles.resultValue, { color: interesResult.gananciaReal >= 0 ? Colors.accent : Colors.danger }]}>
                    {interesResult.gananciaReal >= 0 ? '+' : ''}{fmt2(interesResult.gananciaReal)}
                  </Text>
                </View>
                {interesResult.gananciaReal < 0 && (
                  <Text style={styles.warning}>
                    ⚠️ Con esta tasa pierdes poder adquisitivo frente a la inflación. Busca opciones por encima del 3.5%.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>¿Qué es la TREA?</Text>
              <Text style={styles.infoText}>
                La TREA (Tasa de Rendimiento Efectivo Anual) es el porcentaje real que ganas al año.
                Ya incluye la capitalización de intereses. Es el número que debes comparar entre bancos — no te dejes engañar por tasas nominales.
              </Text>
            </View>
          </>
        )}

        {/* MODO META */}
        {mode === 'meta' && (
          <>
            <Text style={styles.subtitle}>Dime tu meta y te digo cuánto ahorrar por mes y dónde</Text>

            <View style={styles.card}>
              <Label text="¿Cuánto quieres ahorrar? (S/)" />
              <TextInput
                style={styles.input}
                value={meta}
                onChangeText={setMeta}
                keyboardType="numeric"
                placeholder="Ej: 20000"
                placeholderTextColor={Colors.textMuted}
              />

              <Label text="¿Ya tienes algo ahorrado? (S/)" />
              <TextInput
                style={styles.input}
                value={ahorroActual}
                onChangeText={setAhorroActual}
                keyboardType="numeric"
                placeholder="Ej: 2000 (pon 0 si no tienes)"
                placeholderTextColor={Colors.textMuted}
              />

              <Label text="¿En cuánto tiempo?" />
              <View style={styles.presets}>
                {GOAL_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.months}
                    style={[styles.preset, goalMonths === p.months && styles.presetActive]}
                    onPress={() => setGoalMonths(p.months)}
                  >
                    <Text style={[styles.presetText, goalMonths === p.months && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {metaResult && (
              <>
                {/* RESULTADO PRINCIPAL */}
                <View style={styles.metaHero}>
                  <Text style={styles.metaHeroLabel}>Necesitas ahorrar</Text>
                  <Text style={styles.metaHeroAmount}>{fmt(metaResult.pmt)}</Text>
                  <Text style={styles.metaHeroPer}>por mes durante {goalMonths} meses</Text>
                </View>

                {/* PROGRESO ACTUAL */}
                {parseFloat(ahorroActual) > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tu avance actual</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${metaResult.progress}%` as any }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressCurrent}>{fmt(parseFloat(ahorroActual))} ahorrado</Text>
                      <Text style={styles.progressGoal}>Meta: {fmt(parseFloat(meta))}</Text>
                    </View>
                    <Text style={styles.progressNote}>
                      Tu ahorro actual crecerá a {fmt(metaResult.pvFuture)} al {metaResult.rec.trea}% anual
                    </Text>
                  </View>
                )}

                {/* DESGLOSE */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Desglose al llegar a la meta</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Lo que aportarás en total</Text>
                    <Text style={styles.resultValue}>{fmt(metaResult.totalAportado)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Intereses que ganarás</Text>
                    <Text style={[styles.resultValue, { color: Colors.accent }]}>
                      +{fmt(metaResult.totalIntereses)}
                    </Text>
                  </View>
                  <View style={[styles.resultRow, styles.resultTotal]}>
                    <Text style={styles.resultTotalLabel}>Total final</Text>
                    <Text style={styles.resultTotalValue}>{fmt(parseFloat(meta))}</Text>
                  </View>
                </View>

                {/* RECOMENDACIÓN */}
                <View style={styles.recCard}>
                  <Text style={styles.recTitle}>Dónde invertir para este plazo</Text>
                  <Text style={styles.recWhere}>{metaResult.rec.where}</Text>
                  <View style={styles.recTreaRow}>
                    <Text style={styles.recTreaLabel}>TREA estimada</Text>
                    <Text style={styles.recTrea}>{metaResult.rec.trea}% anual</Text>
                  </View>
                  <Text style={styles.recTip}>{metaResult.rec.tip}</Text>
                </View>
              </>
            )}
          </>
        )}
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
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  modeBtnTextActive: { color: '#FFF', fontWeight: '700' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
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

  metaHero: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  metaHeroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaHeroAmount: { fontSize: 48, fontWeight: '900', color: '#A8E6CF', marginTop: 4 },
  metaHeroPer: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  progressBarBg: { height: 12, backgroundColor: Colors.border, borderRadius: 6, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: 12, backgroundColor: Colors.accent, borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressCurrent: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  progressGoal: { fontSize: 13, color: Colors.textMuted },
  progressNote: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  recCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primaryLight + '40',
    marginBottom: 14,
  },
  recTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recWhere: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  recTreaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recTreaLabel: { fontSize: 13, color: Colors.textSecondary },
  recTrea: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  recTip: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
