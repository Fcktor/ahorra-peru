import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS, SavingsOption } from '@/constants/savings';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';
import OptionCard from '@/components/OptionCard';
import BCRPWidget from '@/components/BCRPWidget';
import { useAuth } from '@/context/auth';

const CATEGORIES = ['Todos', 'Depósito a plazo', 'Cuenta de ahorros', 'Fondo mutuo', 'Beneficio laboral', 'Pensiones'];
const SORT_OPTIONS = ['Mayor tasa', 'Menor riesgo', 'Mayor liquidez'];

const LIQUIDITY_ORDER = ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'];
const RISK_ORDER = ['muy bajo', 'bajo', 'medio', 'alto'];

export default function ComparadorScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('Mayor tasa');

  useEffect(() => {
    fetchBCRPData()
      .then(setBcrpData)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = activeCategory === 'Todos'
      ? SAVINGS_OPTIONS
      : SAVINGS_OPTIONS.filter((o) => o.category === activeCategory);

    if (sortBy === 'Mayor tasa') {
      list = [...list].sort((a, b) => b.rateMax - a.rateMax);
    } else if (sortBy === 'Menor riesgo') {
      list = [...list].sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk));
    } else if (sortBy === 'Mayor liquidez') {
      list = [...list].sort(
        (a, b) => LIQUIDITY_ORDER.indexOf(a.liquidity) - LIQUIDITY_ORDER.indexOf(b.liquidity)
      );
    }
    return list;
  }, [activeCategory, sortBy]);

  const handlePress = (option: SavingsOption) => {
    router.push({ pathname: '/detalle', params: { id: option.id } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OptionCard option={item} onPress={handlePress} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.appTitle}>💰 AhorraPeru</Text>
                  <Text style={styles.subtitle}>¿Dónde hacer crecer tu dinero?</Text>
                </View>
                {user ? (
                  <TouchableOpacity style={styles.accountBtn} onPress={signOut}>
                    <Text style={styles.accountBtnText}>Salir</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.accountBtn} onPress={() => router.push('/login')}>
                    <Text style={styles.accountBtnText}>Entrar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <BCRPWidget data={bcrpData} loading={loading} />

            <Text style={styles.sectionLabel}>Categoría</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.chip, activeCategory === item && styles.chipActive]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chips}
            />

            <View style={styles.sortRow}>
              <Text style={styles.sectionLabel}>Ordenar por</Text>
              <View style={styles.sortButtons}>
                {SORT_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
                    onPress={() => setSortBy(s)}
                  >
                    <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.resultCount}>
              {filtered.length} opción{filtered.length !== 1 ? 'es' : ''}
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appTitle: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  accountBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chips: { paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },
  sortRow: { marginBottom: 8 },
  sortButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  sortText: { fontSize: 12, color: Colors.textSecondary },
  sortTextActive: { color: '#FFF', fontWeight: '700' },
  resultCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
});
