import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { CREDIT_CARDS, CreditCard } from '@/constants/creditCards';

// Ordenadas por TCEA ascendente (la más barata primero). Las tarjetas sin TCEA
// verificada van al final, no se asume que sean más baratas ni más caras.
const SORTED_CARDS = [...CREDIT_CARDS].sort((a, b) => {
  const tceaA = parseTcea(a.tcea);
  const tceaB = parseTcea(b.tcea);
  if (tceaA === null && tceaB === null) return 0;
  if (tceaA === null) return 1;
  if (tceaB === null) return -1;
  return tceaA - tceaB;
});

function parseTcea(tcea?: string): number | null {
  if (!tcea) return null;
  const match = tcea.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

// Ilustración propia por banco, no el diseño ni la foto oficial de la tarjeta:
// tonos evocadores de cada marca, no una réplica exacta de su paleta corporativa.
const BANK_GRADIENTS: Record<string, [string, string]> = {
  BCP: ['#123B6B', '#0B2745'],
  Interbank: ['#1F6E52', '#123D2E'],
  BBVA: ['#1E3A8A', '#152A63'],
  Scotiabank: ['#7A2331', '#4E1620'],
  Falabella: ['#0E7C86', '#0A5259'],
  'Diners Club': ['#2B2B38', '#17171F'],
};
const DEFAULT_GRADIENT: [string, string] = [Colors.textSecondary, Colors.textPrimary];

export default function TarjetasScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Compara tarjetas de crédito</Text>
          <Text style={styles.subtitle}>
            Ordenadas por TCEA (el costo real anual) de menor a mayor. Es la cifra que de verdad
            debes comparar, no la membresía ni la tasa que anuncia el banco.
          </Text>
        </View>

        {SORTED_CARDS.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}

        <Text style={styles.footnote}>
          Las ilustraciones son referenciales (no el diseño oficial de cada banco). TCEA no marcada
          como verificada: cifras referenciales, confirma las condiciones vigentes directamente con
          el banco antes de aplicar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CardVisual({ card }: { card: CreditCard }) {
  const colors = BANK_GRADIENTS[card.bank] ?? DEFAULT_GRADIENT;
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardVisual}
    >
      <View style={styles.chip} />
      {card.network && <Text style={styles.cardVisualNetwork}>{card.network.toUpperCase()}</Text>}
    </LinearGradient>
  );
}

function CardRow({ card }: { card: CreditCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <CardVisual card={card} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.bank}>{card.bank}</Text>
          <Text style={styles.name}>{card.name}</Text>
        </View>
        <View style={styles.tceaBox}>
          <Text style={styles.tceaLabel}>TCEA</Text>
          <Text
            style={[
              styles.tceaValue,
              !card.tcea && styles.tceaValueMuted,
              (card.tcea?.length ?? 0) > 10 && styles.tceaValueLong,
            ]}
          >
            {card.tcea ?? 'No publicada'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Membresía</Text>
          <Text style={styles.metaValue}>{card.annualFee}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Ingreso mínimo</Text>
          <Text style={styles.metaValue}>S/ {card.minIncome.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.benefitsList}>
        {card.benefits.slice(0, 2).map((b) => (
          <View key={b} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {card.websiteUrl && (
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(card.websiteUrl!)}>
          <Text style={styles.linkText}>Ver en {card.bank}</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  subtitle: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  cardVisual: {
    width: 56,
    aspectRatio: 1.586,
    borderRadius: 8,
    padding: 6,
    justifyContent: 'space-between',
  },
  chip: { width: 14, height: 10, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  cardVisualNetwork: { fontSize: 8, fontFamily: 'Archivo_800ExtraBold', color: '#fff', fontStyle: 'italic', alignSelf: 'flex-end' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bank: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 17, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, marginTop: 2 },

  tceaBox: { alignItems: 'flex-end', maxWidth: 108, flexShrink: 0 },
  tceaLabel: { fontSize: 9, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  tceaValue: { fontSize: 18, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginTop: 2, textAlign: 'right' },
  tceaValueMuted: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted },
  tceaValueLong: { fontSize: 12, lineHeight: 15 },

  metaRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  metaItem: {},
  metaLabel: { fontSize: 10, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted },
  metaValue: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, marginTop: 2 },

  benefitsList: { marginTop: 14, gap: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  benefitText: { fontSize: 12.5, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  linkText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.primary },

  footnote: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 4, lineHeight: 16, textAlign: 'center' },
});
