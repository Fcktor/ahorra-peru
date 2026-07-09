import React, { useState, useMemo, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';
import { calcInterest } from '@/lib/interestMath';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';

const ON_DARK_TEXT = '#EAF6EE';
const ON_DARK_MUTED = '#A9D9BE';
const SPARKLINE_COLOR = '#8FE3B0';

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

interface Option {
  label: string;
  trea: number;
  risk: string;
  riskColor: string;
  category: string;
  steps: string[];
}

function getOptions(months: number): Option[] {
  if (months <= 3) return [
    { label: 'Cuenta de ahorros', trea: 2, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Cuenta de ahorros', steps: ['Abre o usa tu cuenta de ahorros existente en BCP, Interbank o BBVA', 'Configura una transferencia automática el día que cobras tu sueldo', 'No toques este dinero hasta alcanzar la meta'] },
    { label: 'Fondo mutuo conservador', trea: 6, risk: 'Bajo', riskColor: Colors.riskBajo, category: 'Fondo mutuo', steps: ['Descarga la app Credifondos (BCP) o entra a interfondos.com.pe', 'Abre tu cuenta en 10 minutos con tu DNI', 'Configura aportes automáticos mensuales', 'Los retiros tardan 1-3 días hábiles'] },
  ];
  if (months <= 6) return [
    { label: 'Depósito a plazo 90-180 días', trea: 7.5, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Entra a la app del BCP o Interbank', 'Ve a "Inversiones" → "Depósito a plazo"', 'Elige 90 o 180 días según tu plazo exacto', 'Al vencer, renueva automáticamente hasta llegar a tu meta'] },
    { label: 'CMAC (Caja Municipal)', trea: 10, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Visita una agencia de CMAC Arequipa o CMAC Piura', 'Lleva tu DNI y el monto inicial (desde S/ 250)', 'Abre un depósito a 180 días', 'Renueva al vencimiento añadiendo tu ahorro mensual'] },
    { label: 'Fondo mutuo conservador', trea: 6, risk: 'Bajo', riskColor: Colors.riskBajo, category: 'Fondo mutuo', steps: ['Entra a credifondos.com.pe o interfondos.com.pe', 'Crea tu cuenta con DNI en 10 minutos', 'Haz aportes mensuales automáticos', 'Rescata cuando llegues a tu meta (1-3 días hábiles)'] },
  ];
  if (months <= 12) return [
    { label: 'CMAC Depósito a plazo', trea: 10, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Ve a una agencia de CMAC Arequipa o CMAC Piura', 'Abre depósito a 360 días (mejor tasa)', 'Al vencer, renueva y añade tus ahorros acumulados', 'Activa la renovación automática para no perder días'] },
    { label: 'Fondo mutuo conservador', trea: 6.5, risk: 'Bajo', riskColor: Colors.riskBajo, category: 'Fondo mutuo', steps: ['Descarga Credifondos o entra a Interfondos', 'Abre cuenta con tu DNI', 'Configura aporte automático mensual', 'Deja que el interés compuesto trabaje para ti'] },
    { label: 'Depósito a plazo BCP/Interbank', trea: 8.5, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Usa la app de tu banco de confianza', 'Elige 360 días para la mejor tasa', 'Renueva automáticamente al vencimiento', 'Acumula tus aportes en cuenta de ahorros y deposita en bloque'] },
  ];
  if (months <= 36) return [
    { label: 'CMAC ladder (escalonado)', trea: 10, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Divide tu ahorro en 3 partes iguales', 'Deposita la 1ra a 90 días, 2da a 180 días, 3ra a 360 días en CMAC', 'Al vencer cada tramo, renueva añadiendo tu ahorro mensual', 'Así tienes liquidez parcial cada 3 meses con tasa alta'] },
    { label: 'Fondo mutuo conservador', trea: 7, risk: 'Bajo', riskColor: Colors.riskBajo, category: 'Fondo mutuo', steps: ['Abre cuenta en Credifondos, Interfondos o BBVA AM', 'Configura aporte automático el día que cobras', 'No rescates ante pequeñas caídas — son temporales', 'Rescata todo al llegar a tu meta'] },
    { label: 'Mix CMAC 60% + Fondo 40%', trea: 9, risk: 'Bajo', riskColor: Colors.riskBajo, category: 'Fondo mutuo', steps: ['Abre depósito en CMAC con el 60% de tu ahorro mensual', 'Invierte el 40% restante en fondo mutuo conservador', 'El CMAC da tasa garantizada, el fondo añade potencial extra', 'Revisa el balance cada 6 meses'] },
  ];
  return [
    { label: 'Fondo mutuo moderado', trea: 10.5, risk: 'Medio', riskColor: Colors.warning, category: 'Fondo mutuo', steps: ['Abre cuenta en Interfondos, SURA o Credifondos', 'Elige el fondo moderado (mezcla bonos + acciones)', 'Configura aporte automático mensual', 'No retires ante caídas — a 3+ años el mercado siempre sube', 'Rescata gradualmente cuando te acerques a la meta'] },
    { label: 'CMAC 360 días renovable', trea: 10, risk: 'Muy bajo', riskColor: Colors.accent, category: 'Depósito a plazo', steps: ['Ve a CMAC Arequipa o Piura', 'Abre depósito a 360 días con renovación automática', 'Cada año al renovar, añade tus ahorros acumulados del año', 'La tasa garantizada protege tu capital'] },
    { label: 'Mix Fondo moderado 70% + CMAC 30%', trea: 10.2, risk: 'Medio', riskColor: Colors.warning, category: 'Fondo mutuo', steps: ['Destina 70% de tu ahorro mensual a fondo moderado', 'El 30% restante a CMAC para protección', 'El fondo crece más a largo plazo, CMAC estabiliza', 'Revisa y rebalancea cada 12 meses'] },
  ];
}

function calcPMT(FV: number, PV: number, n: number, annualRate: number): number {
  const r = annualRate / 100 / 12;
  const pvFuture = PV * Math.pow(1 + r, n);
  const remaining = Math.max(0, FV - pvFuture);
  if (r === 0) return remaining / n;
  return remaining * r / (Math.pow(1 + r, n) - 1);
}

function monthsToReach(FV: number, PV: number, pmt: number, annualRate: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil((FV - PV) / pmt);
  let acc = PV;
  for (let i = 0; i < 600; i++) {
    acc = acc * (1 + r) + pmt;
    if (acc >= FV) return i + 1;
  }
  return 600;
}

const fmt = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');
const fmt2 = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CalculadoraScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { award } = useGamification();
  const [mode, setMode] = useState<'interes' | 'meta'>('interes');
  const [selectedOption, setSelectedOption] = useState(0);

  const [capital, setCapital] = useState('10000');
  const [trea, setTrea] = useState('8');
  const [months, setMonths] = useState(12);
  const [compound, setCompound] = useState(true);

  const [meta, setMeta] = useState('20000');
  const [ahorroActual, setAhorroActual] = useState('0');
  const [goalMonths, setGoalMonths] = useState(24);

  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);
  useEffect(() => { fetchBCRPData().then(setBcrpData); }, []);
  const inflacionAnual = (bcrpData?.inflacion ?? 3.5) / 100;

  const interesResult = useMemo(
    () => calcInterest(parseFloat(capital) || 0, parseFloat(trea) || 0, months, compound, inflacionAnual),
    [capital, trea, months, compound, inflacionAnual],
  );

  const metaResult = useMemo(() => {
    const FV = parseFloat(meta) || 0;
    const PV = parseFloat(ahorroActual) || 0;
    const n = goalMonths;
    if (FV <= 0 || n <= 0) return null;

    const options = getOptions(n);
    const opt = options[selectedOption] ?? options[0];
    const r = opt.trea / 100 / 12;

    const pvFuture = PV * Math.pow(1 + r, n);
    const remaining = Math.max(0, FV - pvFuture);
    const pmt = calcPMT(FV, PV, n, opt.trea);
    const totalAportado = pmt * n + PV;
    const totalIntereses = FV - totalAportado;
    const progress = Math.min(100, (PV / FV) * 100);

    const pmtPlus25 = pmt * 1.25;
    const pmtMinus25 = pmt * 0.75;
    const monthsPlus25 = monthsToReach(FV, PV, pmtPlus25, opt.trea);
    const monthsMinus25 = monthsToReach(FV, PV, pmtMinus25, opt.trea);

    const checkpoints = [0.25, 0.5, 0.75, 1.0].map((pct) => {
      const target = FV * pct;
      const m = monthsToReach(target, PV, pmt, opt.trea);
      return { pct, label: `${Math.round(pct * 100)}%`, months: m, amount: target };
    });

    return { pmt, totalAportado, totalIntereses, pvFuture, remaining, progress, options, pmtPlus25, pmtMinus25, monthsPlus25, monthsMinus25, checkpoints };
  }, [meta, ahorroActual, goalMonths, selectedOption]);

  const options = useMemo(() => getOptions(goalMonths), [goalMonths]);

  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (user && interesResult) {
      award(ACTION_KEYS.CALCULATOR_USED, 3, { dedupeKey: `calculator_used:${today}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!interesResult]);

  useEffect(() => {
    if (user && metaResult) {
      award(ACTION_KEYS.CALCULATOR_USED, 3, { dedupeKey: `calculator_used:${today}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!metaResult]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Calculadora</Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'interes' && styles.modeBtnActive]}
            onPress={() => setMode('interes')}
          >
            <Text style={[styles.modeBtnText, mode === 'interes' && styles.modeBtnTextActive]}>¿Cuánto ganaré?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'meta' && styles.modeBtnActive]}
            onPress={() => setMode('meta')}
          >
            <Text style={[styles.modeBtnText, mode === 'meta' && styles.modeBtnTextActive]}>¿Cómo llego a mi meta?</Text>
          </TouchableOpacity>
        </View>

        {/* ── MODO INTERÉS ── */}
        {mode === 'interes' && (
          <>
            <Text style={styles.subtitle}>Simula cuánto ganarás según el tipo de ahorro</Text>
            <View style={styles.card}>
              <Label text="¿Cuánto tienes para invertir? (S/)" />
              <TextInput style={styles.input} value={capital} onChangeText={setCapital} keyboardType="numeric" placeholder="Ej: 5000" placeholderTextColor={Colors.textMuted} />
              <Label text="Tasa anual (TREA %)" />
              <TextInput style={styles.input} value={trea} onChangeText={setTrea} keyboardType="numeric" placeholder="Ej: 8" placeholderTextColor={Colors.textMuted} />
              <Label text="Plazo" />
              <View style={styles.presets}>
                {PRESETS.map((p) => (
                  <TouchableOpacity key={p.months} style={[styles.preset, months === p.months && styles.presetActive]} onPress={() => setMonths(p.months)}>
                    <Text style={[styles.presetText, months === p.months && styles.presetTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Interés compuesto</Text>
                <TouchableOpacity style={[styles.toggle, compound && styles.toggleOn]} onPress={() => setCompound(!compound)}>
                  <View style={[styles.toggleThumb, compound && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.switchHint}>{compound ? 'Los intereses que ganas también generan intereses' : 'Los intereses no se reinvierten (interés simple)'}</Text>
            </View>

            {interesResult && (
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.35, y: 1 }}
                style={styles.resultsCard}
              >
                <Text style={styles.resultsLabel}>EN {months >= 12 ? `${Math.round(months / 12)} AÑO${months >= 24 ? 'S' : ''}` : `${months} MES${months > 1 ? 'ES' : ''}`} TENDRÁS</Text>
                <Text style={styles.resultsAmount}>{fmt2(interesResult.total)}</Text>

                <Sparkline />

                <View style={styles.resultsDivider} />
                <View style={styles.resultRow}>
                  <View>
                    <Text style={styles.resultLabelDark}>Capital inicial</Text>
                    <Text style={styles.resultValueDark}>{fmt2(parseFloat(capital))}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.resultLabelDark}>Intereses ganados</Text>
                    <Text style={[styles.resultValueDark, { color: SPARKLINE_COLOR }]}>+{fmt2(interesResult.ganancia)}</Text>
                  </View>
                </View>
                <View style={styles.resultsDivider} />
                <Text style={styles.realLabel}>Considerando inflación real (~{(inflacionAnual * 100).toFixed(1)}% anual, BCRP)</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabelDark}>Ganancia real</Text>
                  <Text style={[styles.resultValueDark, { color: interesResult.gananciaReal >= 0 ? SPARKLINE_COLOR : '#F5A3A3' }]}>
                    {interesResult.gananciaReal >= 0 ? '+' : ''}{fmt2(interesResult.gananciaReal)}
                  </Text>
                </View>
                {interesResult.gananciaReal < 0 && (
                  <Text style={styles.warningOnDark}>Con esta tasa pierdes poder adquisitivo frente a la inflación.</Text>
                )}
              </LinearGradient>
            )}
            {interesResult && (
              <TouchableOpacity style={styles.darkCta} onPress={() => router.push('/')}>
                <Text style={styles.darkCtaText}>Ver opciones con esta tasa →</Text>
              </TouchableOpacity>
            )}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>¿Qué es la TREA?</Text>
              <Text style={styles.infoText}>La TREA (Tasa de Rendimiento Efectivo Anual) es el porcentaje real que ganas al año. Ya incluye la capitalización de intereses. Es el número que debes comparar entre bancos.</Text>
            </View>
          </>
        )}

        {/* ── MODO META ── */}
        {mode === 'meta' && (
          <>
            <Text style={styles.subtitle}>Dime tu meta y te digo cuánto ahorrar por mes y dónde</Text>

            <View style={styles.card}>
              <Label text="¿Cuánto quieres ahorrar? (S/)" />
              <TextInput style={styles.input} value={meta} onChangeText={(v) => { setMeta(v); setSelectedOption(0); }} keyboardType="numeric" placeholder="Ej: 20000" placeholderTextColor={Colors.textMuted} />
              <Label text="¿Ya tienes algo ahorrado? (S/)" />
              <TextInput style={styles.input} value={ahorroActual} onChangeText={setAhorroActual} keyboardType="numeric" placeholder="Ej: 2000 (pon 0 si no tienes)" placeholderTextColor={Colors.textMuted} />
              <Label text="¿En cuánto tiempo?" />
              <View style={styles.presets}>
                {GOAL_PRESETS.map((p) => (
                  <TouchableOpacity key={p.months} style={[styles.preset, goalMonths === p.months && styles.presetActive]} onPress={() => { setGoalMonths(p.months); setSelectedOption(0); }}>
                    <Text style={[styles.presetText, goalMonths === p.months && styles.presetTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {metaResult && (
              <>
                <View style={styles.metaHero}>
                  <Text style={styles.metaHeroLabel}>Necesitas ahorrar</Text>
                  <Text style={styles.metaHeroAmount}>{fmt(metaResult.pmt)}</Text>
                  <Text style={styles.metaHeroPer}>por mes durante {goalMonths} meses</Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Dónde invertir — elige tu estrategia</Text>
                  <Text style={styles.cardHint}>Toca una opción para ver el plan de acción</Text>
                  {options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.optionRow, selectedOption === i && styles.optionRowActive]}
                      onPress={() => setSelectedOption(i)}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={[styles.optionName, selectedOption === i && styles.optionNameActive]}>{opt.label}</Text>
                        <View style={styles.optionMeta}>
                          <View style={[styles.riskBadge, { backgroundColor: opt.riskColor + '20' }]}>
                            <Text style={[styles.riskText, { color: opt.riskColor }]}>{opt.risk}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.optionRight}>
                        <Text style={[styles.optionTrea, selectedOption === i && { color: Colors.primary }]}>{opt.trea}%</Text>
                        <Text style={styles.optionTreaLabel}>TREA</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.verComparadorBtn} onPress={() => router.push('/')}>
                    <Text style={styles.verComparadorText}>Ver todas las opciones en el comparador →</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Plan de acción — {options[selectedOption]?.label}</Text>
                  {options[selectedOption]?.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>¿Qué pasa si ahorro más o menos?</Text>
                  <View style={styles.scenarioRow}>
                    <View style={[styles.scenarioBox, { borderColor: Colors.danger + '40' }]}>
                      <Text style={styles.scenarioLabel}>−25% menos</Text>
                      <Text style={[styles.scenarioAmount, { color: Colors.danger }]}>{fmt(metaResult.pmtMinus25)}/mes</Text>
                      <Text style={styles.scenarioMonths}>Llegas en {metaResult.monthsMinus25} meses</Text>
                    </View>
                    <View style={[styles.scenarioBox, styles.scenarioCurrent]}>
                      <Text style={styles.scenarioLabel}>Tu plan</Text>
                      <Text style={[styles.scenarioAmount, { color: Colors.primary }]}>{fmt(metaResult.pmt)}/mes</Text>
                      <Text style={styles.scenarioMonths}>{goalMonths} meses</Text>
                    </View>
                    <View style={[styles.scenarioBox, { borderColor: Colors.accent + '40' }]}>
                      <Text style={styles.scenarioLabel}>+25% más</Text>
                      <Text style={[styles.scenarioAmount, { color: Colors.accent }]}>{fmt(metaResult.pmtPlus25)}/mes</Text>
                      <Text style={styles.scenarioMonths}>Llegas en {metaResult.monthsPlus25} meses</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Tu camino a {fmt(parseFloat(meta))}</Text>
                  <Text style={styles.cardHint}>Hitos del recorrido</Text>
                  {metaResult.checkpoints.map((cp) => (
                    <View key={cp.pct} style={styles.checkpointRow}>
                      <View style={styles.checkpointLeft}>
                        <Text style={styles.checkpointPct}>{cp.label}</Text>
                        <Text style={styles.checkpointAmount}>{fmt(cp.amount)}</Text>
                      </View>
                      <View style={styles.checkpointBarBg}>
                        <View style={[styles.checkpointBarFill, { width: `${cp.pct * 100}%` as any, backgroundColor: cp.pct === 1 ? Colors.primary : Colors.primaryLight }]} />
                      </View>
                      <Text style={styles.checkpointMonths}>mes {cp.months}</Text>
                    </View>
                  ))}

                  {parseFloat(ahorroActual) > 0 && (
                    <View style={styles.progressBox}>
                      <Text style={styles.progressLabel}>Tu avance actual</Text>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${metaResult.progress}%` as any }]} />
                      </View>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressCurrent}>{fmt(parseFloat(ahorroActual))}</Text>
                        <Text style={styles.progressGoal}>{fmt(parseFloat(meta))}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Desglose al llegar a la meta</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Lo que aportarás en total</Text>
                    <Text style={styles.resultValue}>{fmt(metaResult.totalAportado)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Intereses que ganarás</Text>
                    <Text style={[styles.resultValue, { color: Colors.accent }]}>+{fmt(metaResult.totalIntereses)}</Text>
                  </View>
                  <View style={[styles.resultRow, styles.resultTotal]}>
                    <Text style={styles.resultTotalLabel}>Total final</Text>
                    <Text style={styles.resultTotalValue}>{fmt(parseFloat(meta))}</Text>
                  </View>
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

function Sparkline() {
  return (
    <Svg viewBox="0 0 300 70" preserveAspectRatio="none" style={{ width: '100%', height: 56, marginTop: 10 }}>
      <Defs>
        <SvgLinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={SPARKLINE_COLOR} stopOpacity={0.45} />
          <Stop offset="1" stopColor={SPARKLINE_COLOR} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M0,60 C60,54 110,44 160,32 C210,20 260,12 300,6 L300,70 L0,70 Z" fill="url(#sparkFill)" />
      <Path d="M0,60 C60,54 110,44 160,32 C210,20 260,12 300,6" fill="none" stroke={SPARKLINE_COLOR} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 16 },

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
  modeBtnText: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted },
  modeBtnTextActive: { fontFamily: 'Figtree_700Bold', color: Colors.background },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  cardHint: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 18,
    fontFamily: 'Archivo_800ExtraBold',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  presetText: { fontSize: 13, fontFamily: 'Figtree_500Medium', color: Colors.textSecondary },
  presetTextActive: { fontFamily: 'Figtree_700Bold', color: Colors.background },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  switchHint: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 4 },

  resultsCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },
  resultsLabel: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: ON_DARK_MUTED, letterSpacing: 1.2 },
  resultsAmount: { fontSize: 38, fontFamily: 'Archivo_800ExtraBold', color: ON_DARK_TEXT, marginTop: 4, letterSpacing: -1 },
  resultsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultLabel: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },
  resultValue: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  resultLabelDark: { fontSize: 11.5, fontFamily: 'Figtree_400Regular', color: ON_DARK_MUTED },
  resultValueDark: { fontSize: 17, fontFamily: 'Archivo_800ExtraBold', color: ON_DARK_TEXT, marginTop: 2 },
  resultTotal: { marginTop: 4 },
  resultTotalLabel: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  resultTotalValue: { fontSize: 20, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  realLabel: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: ON_DARK_MUTED, marginBottom: 8 },
  warning: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.danger, marginTop: 6, lineHeight: 18 },
  warningOnDark: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: '#F5A3A3', marginTop: 6, lineHeight: 18 },
  darkCta: { backgroundColor: Colors.textPrimary, borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 16 },
  darkCtaText: { fontSize: 15, fontFamily: 'Archivo_800ExtraBold', color: Colors.background },
  infoCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoTitle: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.primary, marginBottom: 6 },
  infoText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  metaHero: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  metaHeroLabel: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  metaHeroAmount: { fontSize: 48, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginTop: 4 },
  metaHeroPer: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 4 },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    backgroundColor: Colors.surfaceHigh,
  },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  optionLeft: { flex: 1 },
  optionName: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  optionNameActive: { color: Colors.primary, fontFamily: 'Figtree_700Bold' },
  optionMeta: { flexDirection: 'row', gap: 6 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  riskText: { fontSize: 11, fontFamily: 'Figtree_700Bold' },
  optionRight: { alignItems: 'flex-end' },
  optionTrea: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.textMuted },
  optionTreaLabel: { fontSize: 10, fontFamily: 'Figtree_500Medium', color: Colors.textMuted },
  verComparadorBtn: { marginTop: 8, padding: 10, alignItems: 'center' },
  verComparadorText: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.primary },

  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.background },
  stepText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 20, flex: 1 },

  scenarioRow: { flexDirection: 'row', gap: 8 },
  scenarioBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
  },
  scenarioCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  scenarioLabel: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted, marginBottom: 4 },
  scenarioAmount: { fontSize: 14, fontFamily: 'Archivo_800ExtraBold', textAlign: 'center' },
  scenarioMonths: { fontSize: 10, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  checkpointRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkpointLeft: { width: 68 },
  checkpointPct: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.textSecondary },
  checkpointAmount: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
  checkpointBarBg: { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  checkpointBarFill: { height: 10, borderRadius: 5 },
  checkpointMonths: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, width: 44, textAlign: 'right' },

  progressBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  progressLabel: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginBottom: 6 },
  progressBarBg: { height: 10, backgroundColor: Colors.border, borderRadius: 5, marginBottom: 6, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressCurrent: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.primary },
  progressGoal: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
});
