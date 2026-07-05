import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { CARD_QUESTIONS, CardQuestionOption, matchCards, CardMatchResult } from '@/services/cardMatch';

export default function TarjetasScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CardQuestionOption[]>([]);

  const done = step >= CARD_QUESTIONS.length;
  const results = done ? matchCards(answers) : [];

  const selectOption = (opt: CardQuestionOption) => {
    setAnswers((prev) => [...prev, opt]);
    setStep((s) => s + 1);
  };

  const restart = () => {
    setAnswers([]);
    setStep(0);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Tarjeta ideal para ti</Text>
          <Text style={styles.subtitle}>Responde 5 preguntas y te decimos qué tarjeta de crédito te conviene</Text>
        </View>

        {!done ? (
          <>
            <View style={styles.progressRow}>
              {CARD_QUESTIONS.map((_, i) => (
                <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
              ))}
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>Pregunta {step + 1} de {CARD_QUESTIONS.length}</Text>
              <Text style={styles.questionText}>{CARD_QUESTIONS[step].question}</Text>

              <View style={styles.optionsList}>
                {CARD_QUESTIONS[step].options.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={styles.optionButton}
                    activeOpacity={0.8}
                    onPress={() => selectOption(opt)}
                  >
                    <Text style={styles.optionText}>{opt.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {step > 0 && (
              <TouchableOpacity onPress={() => { setAnswers((p) => p.slice(0, -1)); setStep((s) => s - 1); }} style={styles.backLink}>
                <Ionicons name="arrow-back" size={14} color={Colors.textSecondary} />
                <Text style={styles.backLinkText}>Pregunta anterior</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <ResultsView results={results} onRestart={restart} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultsView({ results, onRestart }: { results: CardMatchResult[]; onRestart: () => void }) {
  const [top, ...rest] = results;
  const alternatives = rest.slice(0, 2);

  if (!top) return null;

  return (
    <View>
      <View style={styles.matchBadge}>
        <Ionicons name="sparkles" size={12} color={Colors.background} />
        <Text style={styles.matchBadgeText}>TU MEJOR MATCH</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultBank}>{top.card.bank}</Text>
        <Text style={styles.resultName}>{top.card.name}</Text>
        <Text style={styles.resultBestFor}>{top.card.bestFor}</Text>

        <View style={styles.resultDivider} />

        {top.card.benefits.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Membresía</Text>
          <Text style={styles.feeValue}>{top.card.annualFee}</Text>
        </View>

        {top.card.websiteUrl && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => Linking.openURL(top.card.websiteUrl!)}>
            <Text style={styles.ctaBtnText}>Ver en {top.card.bank}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.background} />
          </TouchableOpacity>
        )}
      </View>

      {alternatives.length > 0 && (
        <View style={styles.altSection}>
          <Text style={styles.altLabel}>Otras opciones para ti</Text>
          {alternatives.map(({ card }) => (
            <View key={card.id} style={styles.altCard}>
              <View style={styles.altInfo}>
                <Text style={styles.altBank}>{card.bank}</Text>
                <Text style={styles.altName}>{card.name}</Text>
              </View>
              <Text style={styles.altFee}>{card.annualFee}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={onRestart} style={styles.restartBtn}>
        <Ionicons name="refresh" size={14} color={Colors.textSecondary} />
        <Text style={styles.restartText}>Volver a responder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Archivo_800ExtraBold', color: Colors.primary },
  subtitle: { fontSize: 13, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },

  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary },

  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  questionLabel: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  questionText: { fontSize: 18, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, marginBottom: 18, lineHeight: 24 },

  optionsList: { gap: 10 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: { fontSize: 14.5, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, flex: 1, marginRight: 8 },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 16 },
  backLinkText: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary },

  matchBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  matchBadgeText: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.background, letterSpacing: 1 },

  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  resultBank: { fontSize: 11, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  resultName: { fontSize: 24, fontFamily: 'Archivo_800ExtraBold', color: Colors.textPrimary, marginTop: 4 },
  resultBestFor: { fontSize: 13.5, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, marginTop: 8, lineHeight: 20 },

  resultDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },

  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  benefitText: { fontSize: 13.5, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flex: 1, lineHeight: 19 },

  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 18 },
  feeLabel: { fontSize: 12, fontFamily: 'Figtree_600SemiBold', color: Colors.textMuted },
  feeValue: { fontSize: 12.5, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
  },
  ctaBtnText: { fontSize: 14.5, fontFamily: 'Figtree_700Bold', color: Colors.background },

  altSection: { marginTop: 20 },
  altLabel: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  altCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  altInfo: {},
  altBank: { fontSize: 10, fontFamily: 'Figtree_700Bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  altName: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, marginTop: 2 },
  altFee: { fontSize: 11.5, fontFamily: 'Figtree_400Regular', color: Colors.textSecondary, flexShrink: 1, textAlign: 'right', marginLeft: 8 },

  restartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 20 },
  restartText: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textSecondary },
});
