import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { SavingsOption } from '@/constants/savings';

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: Colors.riskBajo,
  medio: Colors.riskMedium,
  alto: Colors.riskHigh,
};

interface Props {
  option: SavingsOption;
  onPress: (option: SavingsOption) => void;
  onSelect?: (option: SavingsOption) => void;
  selected?: boolean;
  selectable?: boolean;
}

export default function OptionCard({ option, onPress, onSelect, selected, selectable }: Props) {
  const riskColor = RISK_COLORS[option.risk] ?? Colors.textMuted;
  const rateDisplay =
    option.rateMin === option.rateMax
      ? `${option.rateMin}%`
      : `${option.rateMin}–${option.rateMax}%`;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(option)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.institution}>{option.institution}</Text>
          <Text style={styles.name}>{option.name}</Text>
        </View>
        <View style={styles.rightBlock}>
          <View style={styles.rateBlock}>
            <Text style={styles.rate}>{rateDisplay}</Text>
            <Text style={styles.rateLabel}>{option.rateLabel ?? 'TREA anual'}</Text>
          </View>
          {selectable && (
            <TouchableOpacity
              style={[styles.selectBtn, selected && styles.selectBtnActive]}
              onPress={(e) => { e.stopPropagation?.(); onSelect?.(option); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>
                {selected ? '✓' : '+'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
          <View style={[styles.dot, { backgroundColor: riskColor }]} />
          <Text style={[styles.badgeText, { color: riskColor }]}>Riesgo {option.risk}</Text>
        </View>
        <View style={styles.liquidityBadge}>
          <Text style={styles.liquidityText}>{option.liquidity}</Text>
        </View>
        {option.minAmount > 0 && (
          <Text style={styles.minAmount}>S/ {option.minAmount.toLocaleString()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.surfaceHigh,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleBlock: { flex: 1, marginRight: 12 },
  institution: {
    fontSize: 11,
    fontFamily: 'Figtree_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  rightBlock: { alignItems: 'flex-end', gap: 8 },
  rateBlock: { alignItems: 'flex-end' },
  rate: {
    fontSize: 36,
    fontFamily: 'Archivo_800ExtraBold',
    color: Colors.primary,
    lineHeight: 40,
  },
  rateLabel: {
    fontSize: 10,
    fontFamily: 'Figtree_500Medium',
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  selectBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  selectBtnText: {
    fontSize: 15,
    fontFamily: 'Figtree_700Bold',
    color: Colors.textMuted,
  },
  selectBtnTextActive: { color: Colors.background },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Figtree_600SemiBold',
  },
  liquidityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liquidityText: {
    fontSize: 12,
    fontFamily: 'Figtree_600SemiBold',
    color: Colors.textSecondary,
  },
  minAmount: {
    fontSize: 11,
    fontFamily: 'Figtree_500Medium',
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
});
