import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
import { getStatementMonthStreak } from '@/services/gamification';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';
import { CategorySpendChart, CategoriaGasto } from '@/components/CategorySpendChart';

interface TopGasto {
  descripcion: string;
  monto: number;
  fecha?: string;
}

interface GastoEvitable {
  descripcion: string;
  monto: number;
  motivo: string;
}

interface PlanAhorro {
  monto_sugerido_mensual: number;
  resumen: string;
}

interface Analysis {
  id: string;
  created_at: string;
  periodo: string | null;
  total_gastado: number;
  categorias: CategoriaGasto[];
  top_gastos: TopGasto[];
  gastos_evitables: GastoEvitable[];
  recomendaciones: string[];
  plan_ahorro: PlanAhorro;
  gastos_evitables_aplicados?: number[];
}

const fmt = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function EstadoCuentaScreen() {
  const router = useRouter();
  const { user, isPro } = useAuth();
  const { award } = useGamification();
  const [picking, setPicking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('bank_statement_analyses')
      .select('*')
      .order('created_at', { ascending: false });
    setHistory((data as Analysis[]) ?? []);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handlePick = useCallback(async () => {
    setError('');
    setPicking(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      setPicking(false);
      if (res.canceled || !res.assets?.[0]) return;

      setAnalyzing(true);
      const asset = res.assets[0];
      // En web, expo-file-system no funciona — leemos el Blob del File API del navegador directamente.
      // En nativo, `uri` es un file:// que hay que leer con expo-file-system.
      if (Platform.OS === 'web' && !asset.file) throw new Error('No se pudo leer el archivo seleccionado');
      const pdfBase64 = Platform.OS === 'web'
        ? await readBlobAsBase64(asset.file as Blob)
        : await new File(asset.uri).base64();

      const { data, error: fnError } = await supabase.functions.invoke('analyze-statement', {
        body: { pdfBase64 },
      });
      if (fnError) {
        const body = await fnError.context?.json?.().catch(() => null);
        throw new Error(body?.error ?? fnError.message);
      }
      if (data?.error) throw new Error(data.error);

      setResult(data as Analysis);
      setHistory((prev) => [data as Analysis, ...prev]);

      if (user) {
        await award(ACTION_KEYS.STATEMENT_UPLOADED, 20, { metadata: { analysisId: (data as Analysis).id } });
        const monthStreak = await getStatementMonthStreak(user.id);
        if (monthStreak >= 2) {
          const monthBucket = new Date().toISOString().slice(0, 7);
          await award(ACTION_KEYS.STATEMENT_STREAK, 25, { dedupeKey: `statement_streak:${monthBucket}` });
        }
      }
    } catch (err) {
      console.error('Error al analizar estado de cuenta:', err);
      setError('No pudimos analizar el PDF. Verifica que sea un estado de cuenta válido e intenta de nuevo.');
    } finally {
      setPicking(false);
      setAnalyzing(false);
    }
  }, [user, award]);

  const toggleAplicado = useCallback(async (analysis: Analysis, index: number) => {
    const current = analysis.gastos_evitables_aplicados ?? [];
    const already = current.includes(index);
    const next = already ? current.filter((i) => i !== index) : [...current, index];

    await supabase.from('bank_statement_analyses').update({ gastos_evitables_aplicados: next }).eq('id', analysis.id);

    const updated = { ...analysis, gastos_evitables_aplicados: next };
    setResult((prev) => (prev?.id === analysis.id ? updated : prev));
    setHistory((prev) => prev.map((h) => (h.id === analysis.id ? updated : h)));

    if (!already && user) {
      await award(ACTION_KEYS.RECOMMENDATION_APPLIED, 15, {
        dedupeKey: `recommendation_applied:${analysis.id}:${index}`,
      });
    }
  }, [user, award]);

  const renderResult = (analysis: Analysis) => (
    <>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total gastado{analysis.periodo ? ` · ${analysis.periodo}` : ''}</Text>
        <Text style={styles.totalValue}>{fmt(analysis.total_gastado)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gasto por categoría</Text>
        <CategorySpendChart categorias={analysis.categorias} />
      </View>

      {analysis.top_gastos?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tus gastos más grandes</Text>
          {analysis.top_gastos.map((g, i) => (
            <View key={i} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listDesc} numberOfLines={1}>{g.descripcion}</Text>
                {g.fecha ? <Text style={styles.listSub}>{g.fecha}</Text> : null}
              </View>
              <Text style={styles.listAmount}>{fmt(g.monto)}</Text>
            </View>
          ))}
        </View>
      )}

      {isPro ? (
        <>
          {analysis.gastos_evitables?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Gastos que podrías evitar</Text>
              {analysis.gastos_evitables.map((g, i) => {
                const aplicado = (analysis.gastos_evitables_aplicados ?? []).includes(i);
                return (
                  <View key={i} style={styles.evitableRow}>
                    <View style={styles.evitableHeader}>
                      <Text style={styles.listDesc} numberOfLines={1}>{g.descripcion}</Text>
                      <Text style={[styles.listAmount, { color: Colors.danger }]}>{fmt(g.monto)}</Text>
                    </View>
                    <Text style={styles.evitableMotivo}>{g.motivo}</Text>
                    <TouchableOpacity style={styles.aplicadoBtn} onPress={() => toggleAplicado(analysis, i)}>
                      <Text style={[styles.aplicadoText, aplicado && styles.aplicadoTextActive]}>
                        {aplicado ? '✓ Aplicado' : 'Marcar como aplicado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recomendaciones para ahorrar más</Text>
            {analysis.recomendaciones.map((r, i) => (
              <View key={i} style={styles.recoRow}>
                <Text style={styles.recoBullet}>•</Text>
                <Text style={styles.recoText}>{r}</Text>
              </View>
            ))}
          </View>

          <View style={styles.goldCard}>
            <Text style={styles.goldTitle}>Tu plan sugerido</Text>
            <Text style={styles.goldAmount}>{fmt(analysis.plan_ahorro.monto_sugerido_mensual)}/mes</Text>
            <Text style={styles.goldText}>{analysis.plan_ahorro.resumen}</Text>
          </View>
        </>
      ) : (
        <PaywallBanner feature="Recomendaciones personalizadas de ahorro" />
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setResult(null)}>
        <Text style={styles.secondaryBtnText}>Analizar otro estado de cuenta</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Analiza tu estado de cuenta</Text>
        <Text style={styles.subtitle}>
          Sube el PDF de tu banco y te decimos en qué se te va la plata — y qué hacer al respecto.
        </Text>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.cardHint}>Necesitas una cuenta para usar esta función.</Text>
            <TouchableOpacity style={styles.cta} onPress={() => router.push('/login')}>
              <Text style={styles.ctaText}>Crear cuenta o iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : result ? (
          renderResult(result)
        ) : (
          <>
            <View style={styles.card}>
              {analyzing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>Analizando tu estado de cuenta...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.cta} onPress={handlePick} disabled={picking}>
                  {picking
                    ? <ActivityIndicator color={Colors.background} />
                    : <Text style={styles.ctaText}>Seleccionar PDF</Text>}
                </TouchableOpacity>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            {history.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Análisis anteriores</Text>
                {loadingHistory && <ActivityIndicator color={Colors.primary} />}
                {history.map((h) => (
                  <TouchableOpacity key={h.id} style={styles.historyRow} onPress={() => setResult(h)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listDesc}>{h.periodo ?? new Date(h.created_at).toLocaleDateString('es-PE')}</Text>
                      <Text style={styles.listSub}>{new Date(h.created_at).toLocaleDateString('es-PE')}</Text>
                    </View>
                    <Text style={styles.listAmount}>{fmt(h.total_gastado)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { fontSize: 20, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  title: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  cardHint: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 12 },

  cta: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.background },
  secondaryBtn: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary },

  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },
  error: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.danger, textAlign: 'center', marginTop: 10 },

  totalCard: { backgroundColor: Colors.primary + '15', borderRadius: 16, padding: 18, marginBottom: 14, alignItems: 'center' },
  totalLabel: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: 32, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },

  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  listDesc: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary },
  listSub: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 2 },
  listAmount: { fontSize: 14, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary },

  evitableRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 4 },
  evitableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  evitableMotivo: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 17 },
  aplicadoBtn: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  aplicadoText: { fontSize: 11, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary },
  aplicadoTextActive: { color: Colors.accent },

  recoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  recoBullet: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary },
  recoText: { flex: 1, fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  goldCard: { backgroundColor: Colors.surfaceHigh, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.primary + '30', marginBottom: 14 },
  goldTitle: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary, marginBottom: 6 },
  goldAmount: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, marginBottom: 8 },
  goldText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 20 },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
