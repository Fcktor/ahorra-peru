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
      if (fnError) throw fnError;

      const initPoint: string = data.init_point;
      if (Platform.OS === 'web') {
        window.location.href = initPoint;
      } else {
        Linking.openURL(initPoint);
        setLoading(false);
      }
    } catch {
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
          <Text style={styles.badge}>PRO</Text>
          <Text style={styles.title}>Hazte Pro</Text>
          <Text style={styles.subtitle}>
            Accede a todas las herramientas para maximizar tus ahorros
          </Text>
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
              ? <ActivityIndicator color="#FFF" />
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
  closeText: { fontSize: 20, color: Colors.textMuted },

  hero: { alignItems: 'center', marginBottom: 24 },
  badge: {
    backgroundColor: Colors.accent,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: { fontSize: 30, fontWeight: '900', color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  priceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  price: { fontSize: 48, fontWeight: '900', color: '#FFF' },
  pricePer: { fontSize: 18, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end', marginBottom: 8 },
  priceSub: { position: 'absolute', bottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuresCardPro: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  featuresTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 12, textTransform: 'uppercase' },
  featuresTitlePro: { fontSize: 13, fontWeight: '700', color: Colors.accent, marginBottom: 12, textTransform: 'uppercase' },
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' },
  checkFree: { fontSize: 14, color: Colors.textMuted },
  checkPro: { fontSize: 14, color: Colors.accent, fontWeight: '800' },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },

  cta: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  ctaSecondary: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaSecondaryText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  disclaimer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 16 },
  error: { fontSize: 13, color: Colors.danger, textAlign: 'center', marginTop: 8 },
});
