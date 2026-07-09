import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { GLOSSARY, GlossaryTerm } from '@/constants/glossary';
import { GlossaryQuiz } from '@/components/GlossaryQuiz';
import { useAuth } from '@/context/auth';

export default function GlosarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<'explorar' | 'quiz'>('explorar');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (term: string) => setExpanded(expanded === term ? null : term);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Glosario Financiero</Text>
      <Text style={styles.subtitle}>Todo lo que necesitas saber para invertir con confianza</Text>

      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'explorar' && styles.modeButtonActive]}
          onPress={() => setMode('explorar')}
        >
          <Text style={[styles.modeButtonText, mode === 'explorar' && styles.modeButtonTextActive]}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'quiz' && styles.modeButtonActive]}
          onPress={() => setMode('quiz')}
        >
          <Text style={[styles.modeButtonText, mode === 'quiz' && styles.modeButtonTextActive]}>Quiz 🎯</Text>
        </TouchableOpacity>
      </View>

      {mode === 'explorar' && (
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
      )}
    </View>
  );

  if (mode === 'quiz') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ScrollView contentContainerStyle={styles.list}>
          {header}
          {user ? (
            <GlossaryQuiz />
          ) : (
            <View style={styles.gateCard}>
              <Text style={styles.cardHint}>Necesitas una cuenta para jugar el quiz y guardar tu progreso.</Text>
              <TouchableOpacity style={styles.cta} onPress={() => router.push('/login')}>
                <Text style={styles.ctaText}>Crear cuenta o iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.term}
        renderItem={({ item }) => <TermCard term={item} expanded={expanded === item.term} onPress={() => toggle(item.term)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
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
  title: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 16 },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeButtonActive: { backgroundColor: Colors.primary },
  modeButtonText: { fontSize: 13, fontFamily: 'Figtree_700Bold', color: Colors.textSecondary },
  modeButtonTextActive: { color: Colors.background },
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Figtree_400Regular',
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  term: { fontSize: 16, fontFamily: 'Figtree_700Bold', color: Colors.primary, flex: 1 },
  chevron: { fontSize: 12, color: Colors.textMuted },
  definition: { fontSize: 14, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 21, marginTop: 10 },
  exampleBox: {
    marginTop: 10,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  exampleLabel: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  example: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  gateCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  cardHint: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginBottom: 12 },
  cta: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.background },
});
