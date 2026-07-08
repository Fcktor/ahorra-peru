import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SAVINGS_OPTIONS, SavingsOption } from '@/constants/savings';
import { fetchBCRPData, BCRPData } from '@/services/bcrp';
import OptionCard from '@/components/OptionCard';
import OptionTableRow from '@/components/OptionTableRow';
import BCRPWidget from '@/components/BCRPWidget';
import QuickCalculatorPanel from '@/components/QuickCalculatorPanel';
import { useAuth } from '@/context/auth';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const CATEGORIES = ['Todos', 'Depósito a plazo', 'Cuenta de ahorros', 'Fondo mutuo', 'Beneficio laboral', 'Pensiones'];
const SORT_OPTIONS = ['Mayor tasa', 'Menor riesgo', 'Mayor liquidez'];
const LIQUIDITY_ORDER = ['inmediata', '1-3 días', 'al vencimiento', 'restringida', 'largo plazo'];
const RISK_ORDER = ['muy bajo', 'bajo', 'medio', 'alto'];

export default function ComparadorScreen() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user, signOut } = useAuth();
  const [bcrpData, setBcrpData] = useState<BCRPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('Mayor tasa');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBCRPData().then(setBcrpData).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = activeCategory === 'Todos'
      ? SAVINGS_OPTIONS
      : SAVINGS_OPTIONS.filter((o) => o.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => o.institution.toLowerCase().includes(q) || o.name.toLowerCase().includes(q));
    }
    if (sortBy === 'Mayor tasa') list = [...list].sort((a, b) => b.rateMax - a.rateMax);
    else if (sortBy === 'Menor riesgo') list = [...list].sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk));
    else if (sortBy === 'Mayor liquidez') list = [...list].sort((a, b) => LIQUIDITY_ORDER.indexOf(a.liquidity) - LIQUIDITY_ORDER.indexOf(b.liquidity));
    return list;
  }, [activeCategory, sortBy, search]);

  const panelProduct = SAVINGS_OPTIONS.find((o) => o.id === selected[0]) ?? filtered[0] ?? SAVINGS_OPTIONS[0];

  const handlePress = (option: SavingsOption) => {
    router.push({ pathname: '/detalle', params: { id: option.id } });
  };

  const handleSelect = (option: SavingsOption) => {
    setSelected((prev) => {
      if (prev.includes(option.id)) return prev.filter((id) => id !== option.id);
      if (prev.length >= 2) return [prev[1], option.id];
      return [...prev, option.id];
    });
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      router.push({ pathname: '/comparar', params: { a: selected[0], b: selected[1] } });
    }
  };

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopMain}>
          <View style={styles.desktopHeaderRow}>
            <View>
              <Text style={styles.desktopTitle}>Comparar opciones</Text>
              <Text style={styles.desktopSubtitle}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''} · actualizado hoy</Text>
            </View>
            <View style={styles.searchBox}>
              <Text style={{ color: Colors.textMuted }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar banco o producto…"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.filterBar}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, activeCategory === item && styles.chipActive]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.sortByLabel}>Ordenar por</Text>
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

          {selected.length > 0 && (
            <View style={styles.desktopCompareBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.floatingCount}>{selected.length}/2 seleccionadas</Text>
                <Text style={styles.floatingNames}>
                  {selected.map((id) => SAVINGS_OPTIONS.find((o) => o.id === id)?.institution ?? id).join(' vs ')}
                </Text>
              </View>
              <View style={styles.floatingBtns}>
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSelected([])}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
                {selected.length === 2 && (
                  <TouchableOpacity style={styles.compareBtn} onPress={handleCompare}>
                    <Text style={styles.compareBtnText}>Comparar →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderCell}>Producto</Text>
              <Text style={styles.tableHeaderCell}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>TREA</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Mínimo</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: 'center' }]}>Riesgo</Text>
              <View />
            </View>
            {filtered.map((opt) => (
              <OptionTableRow
                key={opt.id}
                option={opt}
                selected={selected.includes(opt.id)}
                onPress={(o) => router.push({ pathname: '/detalle', params: { id: o.id } })}
                onSelect={handleSelect}
              />
            ))}
          </View>
          <Text style={styles.disclaimer}>Las TREA mostradas son referenciales y varían según monto y plazo.</Text>
        </ScrollView>

        <ScrollView style={{ flexGrow: 0, flexShrink: 0 }}>
          <QuickCalculatorPanel product={panelProduct} />
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OptionCard
            option={item}
            onPress={handlePress}
            onSelect={handleSelect}
            selected={selected.includes(item.id)}
            selectable
          />
        )}
        contentContainerStyle={[styles.list, selected.length > 0 && styles.listWithBar]}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.appTitle}>Ahorra<Text style={{ color: Colors.primary }}>Perú</Text></Text>
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
                  <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chips}
            />

            <View style={styles.sortRow}>
              <Text style={styles.sectionLabel}>Ordenar</Text>
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

            {selected.length === 0 && (
              <Text style={styles.compareTip}>Toca + en dos opciones para compararlas lado a lado</Text>
            )}
            <Text style={styles.resultCount}>{filtered.length} opción{filtered.length !== 1 ? 'es' : ''}</Text>
          </>
        }
      />

      {/* BARRA FLOTANTE */}
      {selected.length > 0 && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingLeft}>
            <Text style={styles.floatingCount}>{selected.length}/2 seleccionadas</Text>
            <Text style={styles.floatingNames}>
              {selected.map((id) => SAVINGS_OPTIONS.find((o) => o.id === id)?.institution ?? id).join(' vs ')}
            </Text>
          </View>
          <View style={styles.floatingBtns}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSelected([])}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
            {selected.length === 2 && (
              <TouchableOpacity style={styles.compareBtn} onPress={handleCompare}>
                <Text style={styles.compareBtnText}>Comparar →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  desktopContainer: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  desktopMain: { padding: 32, paddingBottom: 60 },
  desktopHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  desktopTitle: { fontFamily: 'Archivo_800ExtraBold', fontSize: 28, color: Colors.textPrimary, letterSpacing: -0.5 },
  desktopSubtitle: { fontSize: 14.5, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 3 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, width: 280,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textPrimary, padding: 0 },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 },
  sortByLabel: { marginLeft: 'auto', fontSize: 13.5, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
  desktopCompareBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.primary + '40',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, marginBottom: 20,
  },
  tableCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, overflow: 'hidden',
  },
  tableHeaderRow: {
    // @ts-expect-error react-native-web supports CSS grid via style passthrough
    display: 'grid',
    gridTemplateColumns: '2.4fr 1.3fr 1fr 1fr 0.9fr 44px',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: Colors.surfaceHigh,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderCell: {
    fontSize: 11.5, fontFamily: 'Figtree_700Bold', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  disclaimer: { fontSize: 12.5, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 14, paddingLeft: 4 },
  list: { padding: 16, paddingBottom: 32 },
  listWithBar: { paddingBottom: 100 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appTitle: {
    fontSize: 26,
    fontFamily: 'Archivo_800ExtraBold',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Figtree_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accountBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountBtnText: {
    fontSize: 13,
    fontFamily: 'Figtree_600SemiBold',
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
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
  chipText: {
    fontSize: 13,
    fontFamily: 'Figtree_500Medium',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: 'Figtree_700Bold',
    color: Colors.background,
  },
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
  sortChipActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  sortText: {
    fontSize: 12,
    fontFamily: 'Figtree_500Medium',
    color: Colors.textSecondary,
  },
  sortTextActive: {
    fontFamily: 'Figtree_700Bold',
    color: Colors.background,
  },
  resultCount: {
    fontSize: 12,
    fontFamily: 'Figtree_400Regular',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  compareTip: {
    fontSize: 12,
    fontFamily: 'Figtree_400Regular',
    color: Colors.textMuted,
    marginBottom: 6,
  },

  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceHigh,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingLeft: { flex: 1 },
  floatingCount: {
    fontSize: 11,
    fontFamily: 'Figtree_600SemiBold',
    color: Colors.textMuted,
  },
  floatingNames: {
    fontSize: 14,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  floatingBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: {
    fontSize: 14,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textSecondary,
  },
  compareBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  compareBtnText: {
    fontSize: 14,
    fontFamily: 'Figtree_700Bold',
    color: Colors.background,
  },
});
