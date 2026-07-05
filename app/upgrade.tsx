import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';
import { supabase } from '@/services/supabase';

const FEATURES_FREE = [
  'Comparador de tasas',
  'Calculadora de intereses',
  'Plan de ahorro básico',
  'Glosario financiero',
];

const FEATURES_PRO = [
  'Todo lo de gratis',
  'Guardar múltiples planes',
  'Alertas cuando cambian las tasas',
  'Historial de tasas (gráfico)',
  'Exportar plan a PDF',
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!user) { router.push('/login'); return; }
    setError('');
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-mp-preference', {
        body: { userId: user.id, userEmail: user.email },
      });
      if (fnError) {
        const body = await fnError.context?.json?.().catch(() => null);
        throw new Error(body?.error ?? fnError.message);
      }
      if (!data?.init_point) throw new Error('La pasarela de pago no devolvió un link de pago');

      const initPoint: string = data.init_point;
      if (Platform.OS === 'web') {
        window.location.href = initPoint;
      } else {
        Linking.openURL(initPoint);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al crear preferencia de pago:', err);
      setError('Error al conectar con el sistema de pago. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
          <Text style={styles.title}>Hazte Pro</Text>
          <Text style={styles.subtitle}>Accede a todas las herramientas para maximizar tus ahorros</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.price}>S/ 12</Text>
          <Text style={styles.pricePer}>/mes</Text>
          <Text style={styles.priceSub}>Cancela cuando quieras</Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Plan Gratis</Text>
          {FEATURES_FREE.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.checkFree}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.featuresCard, styles.featuresCardPro]}>
          <Text style={styles.featuresTitlePro}>Plan Pro</Text>
          {FEATURES_PRO.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.checkPro}>✓</Text>
              <Text style={[styles.featureText, { color: Colors.textPrimary }]}>{f}</Text>
            </View>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!user ? (
          <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.push('/login')}>
            <Text style={styles.ctaSecondaryText}>Primero crea una cuenta gratis</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cta} onPress={handleUpgrade} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.ctaText}>Suscribirme por S/ 12/mes</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Pago seguro con Mercado Pago. Sin compromisos de permanencia.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { fontSize: 20, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  hero: { alignItems: 'center', marginBottom: 24 },
  proBadge: {
    backgroundColor: Colors.highlightDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  proBadgeText: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.background, letterSpacing: 1 },
  title: { fontSize: 30, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  priceCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.highlight + '40',
  },
  price: { fontSize: 52, fontFamily: 'Archivo_800ExtraBold', color: Colors.highlightDark },
  pricePer: { fontSize: 18, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, alignSelf: 'flex-end', marginBottom: 10 },
  priceSub: { position: 'absolute', bottom: 10, fontSize: 12, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },

  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuresCardPro: { borderColor: Colors.highlight + '60', borderWidth: 2 },
  featuresTitle: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  featuresTitlePro: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.highlightDark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' },
  checkFree: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.textMuted },
  checkPro: { fontSize: 14, fontFamily: 'Figtree_700Bold', color: Colors.highlightDark },
  featureText: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flex: 1 },

  cta: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.background },
  ctaSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaSecondaryText: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.primary },
  disclaimer: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 16 },
  error: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.danger, textAlign: 'center', marginTop: 8 },
});
