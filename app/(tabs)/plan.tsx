import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';

interface SavedPlan {
  id: string;
  nombre: string;
  ingreso: number;
  gastos: number;
  savings_rate: number;
  emergency_achieved: boolean;
  created_at: string;
}

const SAVINGS_RATES = [
  { label: '10%', value: 10, desc: 'Mínimo recomendado' },
  { label: '20%', value: 20, desc: 'Buen ritmo' },
  { label: '30%', value: 30, desc: 'Acelerado' },
  { label: '50%', value: 50, desc: 'Modo intensivo' },
];

const TREA_COMPOSITE = 9;

interface Layer {
  name: string;
  percent: number;
  where: string;
  trea: number;
  color: string;
  icon: string;
  tip: string;
}

function getLayers(monthlySavings: number, emergencyGoal: number, emergencyAchieved: boolean): Layer[] {
  const layers: Layer[] = [];

  if (!emergencyAchieved) {
    layers.push({ name: 'Fondo de emergencia', percent: 60, where: 'Fondo mutuo conservador', trea: 6, color: Colors.warning, icon: '🛡️', tip: 'Primero completa 3-6 meses de gastos. Sin esto cualquier imprevisto destruye tu plan.' });
    layers.push({ name: 'Depósito a plazo', percent: 30, where: 'CMAC Arequipa o Piura (90-180 días)', trea: 9, color: Colors.riskBajo, icon: '🏦', tip: 'Mientras construyes tu fondo, ya empieza a generar tasa alta.' });
    layers.push({ name: 'Fondo mutuo moderado', percent: 10, where: 'Credifondos o Interfondos', trea: 10, color: Colors.accent, icon: '📈', tip: 'Un poco para acostumbrarte a invertir en fondos.' });
  } else {
    layers.push({ name: 'Depósito a plazo (ladder)', percent: 50, where: 'CMAC: 33% a 90d, 33% a 180d, 34% a 360d', trea: 10, color: Colors.riskBajo, icon: '🏦', tip: 'Escalonar los plazos te da liquidez parcial cada pocos meses con la tasa más alta.' });
    layers.push({ name: 'Fondo mutuo moderado', percent: 35, where: 'Credifondos, Interfondos o SURA', trea: 10, color: Colors.accent, icon: '📈', tip: 'Crece con interés compuesto automático. Ideal para dinero que no tocarás en 2+ años.' });
    layers.push({ name: 'Reserva de oportunidad', percent: 15, where: 'Cuenta de ahorros o fondo conservador', trea: 6, color: Colors.warning, icon: '⚡', tip: 'Para aprovechar oportunidades: una oferta, un depósito a tasa especial, etc.' });
  }

  return layers;
}

function projectGrowth(monthly: number, trea: number, years: number): number {
  const r = trea / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

const fmt = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

export default function PlanScreen() {
  const router = useRouter();
  const { isPro, user } = useAuth();
  const [ingreso, setIngreso] = useState('3000');
  const [gastos, setGastos] = useState('2000');
  const [savingsRate, setSavingsRate] = useState(20);
  const [emergencyAchieved, setEmergencyAchieved] = useState(false);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [planName, setPlanName] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [exporting, setExporting] = useState(false);

  const parsed = useMemo(() => {
    const ing = parseFloat(ingreso) || 0;
    const gast = parseFloat(gastos) || 0;
    const disponible = ing - gast;
    const ahorro = ing * (savingsRate / 100);
    const emergencyGoal = gast * 4;
    const monthsToEmergency = emergencyGoal / ahorro;
    const layers = getLayers(ahorro, emergencyGoal, emergencyAchieved);
    return { ing, gast, disponible, ahorro, emergencyGoal, monthsToEmergency, layers };
  }, [ingreso, gastos, savingsRate, emergencyAchieved]);

  const projections = useMemo(() => {
    return [1, 2, 3, 5, 10].map((years) => ({
      years,
      total: projectGrowth(parsed.ahorro, TREA_COMPOSITE, years),
      aportado: parsed.ahorro * 12 * years,
    }));
  }, [parsed.ahorro]);

  const maxProjection = projections[projections.length - 1].total;

  const loadSavedPlans = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('savings_plans')
      .select('*')
      .order('created_at', { ascending: false });
    setSavedPlans((data as SavedPlan[]) ?? []);
  }, [user]);

  useEffect(() => { if (isPro) loadSavedPlans(); }, [isPro, loadSavedPlans]);

  const handleSavePlan = useCallback(async () => {
    if (!planName.trim() || !user) return;
    setSavingPlan(true);
    const { data, error } = await supabase
      .from('savings_plans')
      .insert({
        user_id: user.id,
        nombre: planName.trim(),
        ingreso: parsed.ing,
        gastos: parsed.gast,
        savings_rate: savingsRate,
        emergency_achieved: emergencyAchieved,
      })
      .select()
      .single();
    if (!error && data) {
      setSavedPlans((prev) => [data as SavedPlan, ...prev]);
      setPlanName('');
    }
    setSavingPlan(false);
  }, [planName, user, parsed.ing, parsed.gast, savingsRate, emergencyAchieved]);

  const handleLoadPlan = useCallback((p: SavedPlan) => {
    setIngreso(String(p.ingreso));
    setGastos(String(p.gastos));
    setSavingsRate(p.savings_rate);
    setEmergencyAchieved(p.emergency_achieved);
  }, []);

  const handleDeletePlan = useCallback(async (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('savings_plans').delete().eq('id', id);
  }, []);

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const layersHtml = parsed.layers.map((layer) => {
        const amount = parsed.ahorro * (layer.percent / 100);
        return `<tr><td style="padding:6px 0;">${layer.icon} ${layer.name}<br/><span style="color:#6E7D74;font-size:12px;">${layer.where}</span></td><td style="text-align:right;font-weight:bold;">${fmt(amount)} (${layer.percent}%)</td></tr>`;
      }).join('');

      const projHtml = projections.map((p) => `<tr><td style="padding:6px 0;">${p.years} año(s)</td><td style="text-align:right;">${fmt(p.total)}</td></tr>`).join('');

      const html = `
        <html>
          <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; color:#16211B; padding: 24px;">
            <h1 style="color:#0E7A54;">Mi Plan de Ahorro — AhorraPeru</h1>
            <p style="color:#5B6B61;">Generado el ${new Date().toLocaleDateString('es-PE')}</p>

            <h2>Tu situación mensual</h2>
            <p>Ingreso neto: <strong>${fmt(parsed.ing)}</strong><br/>
            Gastos fijos: <strong>${fmt(parsed.gast)}</strong><br/>
            Margen disponible: <strong>${fmt(parsed.disponible)}</strong></p>

            <h2>Ahorro (${savingsRate}% del ingreso)</h2>
            <p>Ahorras <strong>${fmt(parsed.ahorro)}/mes</strong> — ${fmt(parsed.ahorro * 12)}/año</p>

            <h2>Cómo distribuir tu ahorro</h2>
            <table style="width:100%; border-collapse:collapse;">${layersHtml}</table>

            <h2>Proyección a futuro (~${TREA_COMPOSITE}% anual)</h2>
            <table style="width:100%; border-collapse:collapse;">${projHtml}</table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
      }
    } catch {
      // el usuario simplemente puede reintentar; no hay estado que revertir
    } finally {
      setExporting(false);
    }
  }, [parsed, projections, savingsRate]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Mi Plan de Ahorro</Text>
        <Text style={styles.subtitle}>Personaliza tu estrategia y ve crecer tu dinero</Text>

        <TouchableOpacity style={styles.statementCard} onPress={() => router.push('/estado-cuenta')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statementTitle}>📄 Analiza tu estado de cuenta</Text>
            <Text style={styles.statementSub}>Sube el PDF de tu banco y descubre en qué se te va la plata</Text>
          </View>
          <Text style={styles.statementArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu situación mensual</Text>
          <Text style={styles.label}>Ingreso neto mensual (S/)</Text>
          <TextInput style={styles.input} value={ingreso} onChangeText={setIngreso} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.label}>Gastos fijos mensuales (S/)</Text>
          <TextInput style={styles.input} value={gastos} onChangeText={setGastos} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          {parsed.disponible > 0 && (
            <View style={styles.disponibleBox}>
              <Text style={styles.disponibleLabel}>Margen real disponible</Text>
              <Text style={styles.disponibleValue}>{fmt(parsed.disponible)}/mes</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cuánto quieres ahorrar?</Text>
          <Text style={styles.cardHint}>El porcentaje de tu ingreso que apartas antes de gastar</Text>
          <View style={styles.rateGrid}>
            {SAVINGS_RATES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.rateBtn, savingsRate === r.value && styles.rateBtnActive]}
                onPress={() => setSavingsRate(r.value)}
              >
                <Text style={[styles.rateBtnLabel, savingsRate === r.value && styles.rateBtnLabelActive]}>{r.label}</Text>
                <Text style={[styles.rateBtnDesc, savingsRate === r.value && styles.rateBtnDescActive]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ahorroResult}>
            <View>
              <Text style={styles.ahorroLabel}>Ahorras por mes</Text>
              <Text style={styles.ahorroValue}>{fmt(parsed.ahorro)}</Text>
            </View>
            <View style={styles.ahorroRight}>
              <Text style={styles.ahorroLabel}>Al año</Text>
              <Text style={[styles.ahorroValue, { color: Colors.accent }]}>{fmt(parsed.ahorro * 12)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿En qué fase estás?</Text>
          <View style={styles.faseRow}>
            <TouchableOpacity style={[styles.faseBtn, !emergencyAchieved && styles.faseBtnActive]} onPress={() => setEmergencyAchieved(false)}>
              <Text style={[styles.faseBtnText, !emergencyAchieved && styles.faseBtnTextActive]}>🛡️ Construyendo fondo de emergencia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.faseBtn, emergencyAchieved && styles.faseBtnActive]} onPress={() => setEmergencyAchieved(true)}>
              <Text style={[styles.faseBtnText, emergencyAchieved && styles.faseBtnTextActive]}>🚀 Ya tengo fondo de emergencia</Text>
            </TouchableOpacity>
          </View>
          {!emergencyAchieved && (
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyGoal}>Meta fondo emergencia: <Text style={{ fontFamily: 'Figtree_700Bold' }}>{fmt(parsed.emergencyGoal)}</Text></Text>
              <Text style={styles.emergencyTime}>Con este ahorro lo logras en ~{Math.ceil(parsed.monthsToEmergency * 0.6)} meses (aportando el 60% a esto)</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cómo distribuir tu ahorro</Text>
          <Text style={styles.cardHint}>{fmt(parsed.ahorro)}/mes dividido así:</Text>
          {parsed.layers.map((layer) => {
            const amount = parsed.ahorro * (layer.percent / 100);
            return (
              <View key={layer.name} style={styles.layerItem}>
                <View style={styles.layerHeader}>
                  <View style={styles.layerTitleRow}>
                    <Text style={styles.layerIcon}>{layer.icon}</Text>
                    <View>
                      <Text style={styles.layerName}>{layer.name}</Text>
                      <Text style={styles.layerWhere}>{layer.where}</Text>
                    </View>
                  </View>
                  <View style={styles.layerAmounts}>
                    <Text style={[styles.layerAmount, { color: layer.color }]}>{fmt(amount)}</Text>
                    <Text style={styles.layerPercent}>{layer.percent}%</Text>
                  </View>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${layer.percent}%` as any, backgroundColor: layer.color }]} />
                </View>
                <View style={styles.layerFooter}>
                  <Text style={[styles.layerTrea, { color: Colors.primary, backgroundColor: Colors.primary + '20' }]}>TREA ~{layer.trea}%</Text>
                  <Text style={styles.layerTip}>{layer.tip}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proyección a futuro</Text>
          <Text style={styles.cardHint}>Aportando {fmt(parsed.ahorro)}/mes al ~{TREA_COMPOSITE}% anual promedio</Text>
          {projections.map((p) => {
            const barWidth = maxProjection > 0 ? (p.total / maxProjection) * 100 : 0;
            const ganancia = p.total - p.aportado;
            return (
              <View key={p.years} style={styles.projRow}>
                <Text style={styles.projYear}>{p.years}a</Text>
                <View style={styles.projBarContainer}>
                  <View style={styles.projBarBg}>
                    <View style={[styles.projBarAportado, { width: `${(p.aportado / maxProjection) * 100}%` as any }]} />
                    <View style={[styles.projBarGanancia, { width: `${barWidth}%` as any }]} />
                  </View>
                  <View style={styles.projLabels}>
                    <Text style={styles.projTotal}>{fmt(p.total)}</Text>
                    <Text style={styles.projGanancia}>+{fmt(ganancia)} intereses</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
              <Text style={styles.legendText}>Lo que aportas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Intereses ganados</Text>
            </View>
          </View>
        </View>

        {isPro ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Guardar este plan</Text>
              <View style={styles.saveRow}>
                <TextInput
                  style={styles.saveInput}
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="Nombre del plan (ej. Plan agresivo)"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, (!planName.trim() || savingPlan) && styles.saveBtnOff]}
                  onPress={handleSavePlan}
                  disabled={!planName.trim() || savingPlan}
                >
                  {savingPlan
                    ? <ActivityIndicator color={Colors.background} size="small" />
                    : <Text style={styles.saveBtnText}>Guardar</Text>}
                </TouchableOpacity>
              </View>

              {savedPlans.map((p) => (
                <View key={p.id} style={styles.savedRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleLoadPlan(p)}>
                    <Text style={styles.savedName}>{p.nombre}</Text>
                    <Text style={styles.savedSub}>
                      {fmt(p.ingreso * (p.savings_rate / 100))}/mes · {new Date(p.created_at).toLocaleDateString('es-PE')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePlan(p.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPdf} disabled={exporting}>
              {exporting
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.exportBtnText}>📄 Exportar plan a PDF</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ gap: 0 }}>
            <PaywallBanner feature="Guardar múltiples planes" />
            <PaywallBanner feature="Exportar plan a PDF" />
          </View>
        )}

        <View style={styles.goldCard}>
          <Text style={styles.goldTitle}>La regla más importante</Text>
          <Text style={styles.goldText}>
            No ahorres lo que sobra después de gastar.{'\n'}
            <Text style={{ fontFamily: 'Figtree_700Bold' }}>Aparta primero, gasta lo que queda.</Text>
            {'\n\n'}
            Configura una transferencia automática el día que recibes tu sueldo. Si el dinero nunca llega a tu cuenta de gastos, no puedes gastarlo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 20 },

  statementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  statementTitle: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.background },
  statementSub: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.background + 'DD', marginTop: 2, lineHeight: 17 },
  statementArrow: { fontSize: 20, fontFamily: 'Figtree_700Bold', color: Colors.background },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  cardHint: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginBottom: 12 },

  label: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 18, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },

  disponibleBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.accent + '15', borderRadius: 10, padding: 12, marginTop: 12 },
  disponibleLabel: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.accent },
  disponibleValue: { fontSize: 16, fontFamily: 'Archivo_800ExtraBold', color: Colors.accent },

  rateGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  rateBtn: { flex: 1, minWidth: '40%', backgroundColor: Colors.surfaceHigh, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  rateBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rateBtnLabel: { fontSize: 20, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary },
  rateBtnLabelActive: { color: Colors.background },
  rateBtnDesc: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 2 },
  rateBtnDescActive: { color: Colors.background + 'CC' },

  ahorroResult: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primary + '15', borderRadius: 12, padding: 14 },
  ahorroLabel: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 2 },
  ahorroValue: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  ahorroRight: { alignItems: 'flex-end' },

  faseRow: { gap: 8 },
  faseBtn: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  faseBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  faseBtnText: { fontSize: 14, fontFamily: 'Figtree_500Medium', color: Colors.textSecondary },
  faseBtnTextActive: { fontFamily: 'Figtree_700Bold', color: Colors.primary },

  emergencyInfo: { marginTop: 12, padding: 12, backgroundColor: Colors.warning + '15', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  emergencyGoal: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },
  emergencyTime: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.warning, marginTop: 4 },

  layerItem: { marginBottom: 16 },
  layerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  layerTitleRow: { flexDirection: 'row', gap: 8, flex: 1 },
  layerIcon: { fontSize: 22, marginTop: 2 },
  layerName: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  layerWhere: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 2 },
  layerAmounts: { alignItems: 'flex-end' },
  layerAmount: { fontSize: 16, fontFamily: 'Archivo_800ExtraBold' },
  layerPercent: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  barBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 8 },
  barFill: { height: 8, borderRadius: 4 },

  layerFooter: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  layerTrea: { fontSize: 11, fontFamily: 'Figtree_700Bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  layerTip: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, flex: 1, lineHeight: 16 },

  projRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  projYear: { fontSize: 12, fontFamily: 'Figtree_700Bold', color: Colors.textSecondary, width: 24 },
  projBarContainer: { flex: 1 },
  projBarBg: { height: 20, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  projBarAportado: { position: 'absolute', height: '100%', backgroundColor: Colors.surfaceHigh, borderRadius: 6 },
  projBarGanancia: { position: 'absolute', height: '100%', backgroundColor: Colors.primary + '80', borderRadius: 6 },
  projLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  projTotal: { fontSize: 13, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary },
  projGanancia: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: Colors.primary },

  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  saveRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  saveBtnOff: { backgroundColor: Colors.border },
  saveBtnText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.background },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 10 },
  savedName: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary },
  savedSub: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.danger },

  exportBtn: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  exportBtnText: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary },

  goldCard: { backgroundColor: Colors.surfaceHigh, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.primary + '30' },
  goldTitle: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary, marginBottom: 10 },
  goldText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 21 },
});
