import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS } from '@/constants/savings';
import { RateHistoryChart } from '@/components/RateHistoryChart';
import { useAuth } from '@/context/auth';
import { useGamification } from '@/context/gamification';
import { ACTION_KEYS } from '@/lib/gamification';
import { supabase } from '@/services/supabase';
import PaywallBanner from '@/components/PaywallBanner';

interface RateChange {
  id: string;
  product_id: string;
  product_label: string;
  old_rate_min: number | null;
  old_rate_max: number | null;
  new_rate_min: number;
  new_rate_max: number;
  created_at: string;
}

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
  const { isPro, user } = useAuth();
  const { award } = useGamification();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [rateChanges, setRateChanges] = useState<RateChange[]>([]);
  const [alertsSeenAt, setAlertsSeenAt] = useState<string | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const loadAlertsData = useCallback(async () => {
    if (!user) return;
    setLoadingAlerts(true);
    const [{ data: follows }, { data: changes }, { data: profile }] = await Promise.all([
      supabase.from('followed_products').select('product_id').eq('user_id', user.id),
      supabase.from('rate_changes').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('profiles').select('alerts_seen_at').eq('id', user.id).single(),
    ]);
    setFollowedIds(new Set((follows ?? []).map((f: { product_id: string }) => f.product_id)));
    setRateChanges((changes as RateChange[]) ?? []);
    setAlertsSeenAt(profile?.alerts_seen_at ?? null);
    setLoadingAlerts(false);
  }, [user]);

  useEffect(() => { if (isPro) loadAlertsData(); }, [isPro, loadAlertsData]);

  const toggleFollow = useCallback(async (productId: string) => {
    if (!user) return;
    const isFollowing = followedIds.has(productId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(productId); else next.add(productId);
      return next;
    });
    if (isFollowing) {
      await supabase.from('followed_products').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      await supabase.from('followed_products').insert({ user_id: user.id, product_id: productId });
      await award(ACTION_KEYS.PRODUCT_FOLLOWED, 5, { dedupeKey: `product_followed:${productId}` });
    }
  }, [user, followedIds, award]);

  const newChanges = rateChanges.filter((c) => followedIds.has(c.product_id) && (!alertsSeenAt || c.created_at > alertsSeenAt));

  const markAlertsSeen = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setAlertsSeenAt(now);
    await supabase.from('profiles').update({ alerts_seen_at: now }).eq('id', user.id);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.title}>Ranking de tasas</Text>
          <Text style={styles.subtitle}>Rendimiento anual por producto de ahorro en Perú</Text>
        </View>

        <RateHistoryChart />

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

        {isPro ? (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Text style={styles.alertsTitle}>🔔 Novedades de tasas</Text>
              {newChanges.length > 0 && (
                <TouchableOpacity onPress={markAlertsSeen}>
                  <Text style={styles.alertsSeenBtn}>Marcar como visto</Text>
                </TouchableOpacity>
              )}
            </View>
            {loadingAlerts ? (
              <ActivityIndicator color={Colors.primary} />
            ) : newChanges.length === 0 ? (
              <Text style={styles.alertsEmpty}>
                {followedIds.size === 0
                  ? 'Toca el 🔕 junto a un producto para seguirlo y recibir avisos aquí cuando cambie su tasa.'
                  : 'No hay cambios nuevos en los productos que sigues.'}
              </Text>
            ) : (
              newChanges.map((c) => (
                <View key={c.id} style={styles.alertRow}>
                  <Text style={styles.alertProduct}>{c.product_label}</Text>
                  <View style={styles.alertChangeRow}>
                    <Text style={styles.alertChange}>
                      {c.old_rate_min != null ? `${c.old_rate_min}–${c.old_rate_max}%` : '—'} → {c.new_rate_min}–{c.new_rate_max}%
                    </Text>
                    <Text style={styles.alertDate}>{new Date(c.created_at).toLocaleDateString('es-PE')}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <PaywallBanner feature="Alertas de cambio de tasa" />
          </View>
        )}

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
                {isPro && (
                  <TouchableOpacity onPress={() => toggleFollow(opt.id)} style={styles.followBtn}>
                    <Text style={styles.followIcon}>{followedIds.has(opt.id) ? '🔔' : '🔕'}</Text>
                  </TouchableOpacity>
                )}
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
  title: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  subtitle: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 4 },

  legend: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendTitle: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },

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
    fontFamily: 'Figtree_400Regular',
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
  rowInstitution: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  rowName: { fontSize: 10, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 1 },

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
    backgroundColor: 'rgba(22,33,27,0.12)',
  },
  barBase: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  barExt: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },

  rowRight: { width: 62, paddingLeft: 8, alignItems: 'flex-end' },
  rateText: { fontSize: 12, fontFamily: 'Archivo_800ExtraBold' },
  rateLabel: { fontSize: 9, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, textAlign: 'right' },

  followBtn: { paddingLeft: 8, paddingVertical: 4 },
  followIcon: { fontSize: 16 },

  alertsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertsTitle: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary },
  alertsSeenBtn: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.primary },
  alertsEmpty: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, lineHeight: 18 },
  alertRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  alertProduct: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary },
  alertChangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  alertChange: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary },
  alertDate: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  notes: { backgroundColor: Colors.surface, marginTop: 8, padding: 16 },
  notesTitle: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  notesText: { fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 20 },

  infoCard: {
    backgroundColor: Colors.surfaceHigh,
    margin: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoTitle: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.primary, marginBottom: 6 },
  infoText: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 20 },
});
