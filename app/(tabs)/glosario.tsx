import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { GLOSSARY, GlossaryTerm } from '@/constants/glossary';

export default function GlosarioScreen() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (term: string) => setExpanded(expanded === term ? null : term);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.term}
        renderItem={({ item }) => <TermCard term={item} expanded={expanded === item.term} onPress={() => toggle(item.term)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Glosario Financiero</Text>
            <Text style={styles.subtitle}>
              Todo lo que necesitas saber para invertir con confianza
            </Text>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar término..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function TermCard({ term, expanded, onPress }: { term: GlossaryTerm; expanded: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.term}>{term.term}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <>
          <Text style={styles.definition}>{term.definition}</Text>
          {term.example && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>Ejemplo</Text>
              <Text style={styles.example}>{term.example}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  term: { fontSize: 16, fontWeight: '700', color: Colors.primary, flex: 1 },
  chevron: { fontSize: 12, color: Colors.textMuted },
  definition: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginTop: 10 },
  exampleBox: {
    marginTop: 10,
    backgroundColor: Colors.accent + '15',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  exampleLabel: { fontSize: 10, fontWeight: '700', color: Colors.accent, textTransform: 'uppercase', marginBottom: 4 },
  example: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
