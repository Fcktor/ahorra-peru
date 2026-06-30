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

const LIQUIDITY_ICONS: Record<string, string> = {
  inmediata: '⚡',
  '1-3 días': '🕐',
  'al vencimiento': '🔒',
  restringida: '⛔',
  'largo plazo': '🏗️',
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
  const liquidityIcon = LIQUIDITY_ICONS[option.liquidity] ?? '📅';
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
          <Text style={styles.liquidityIcon}>{liquidityIcon}</Text>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  rightBlock: { alignItems: 'flex-end', gap: 8 },
  rateBlock: { alignItems: 'flex-end' },
  rate: {
    fontSize: 36,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.primary,
    lineHeight: 40,
  },
  rateLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  selectBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  selectBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  liquidityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  liquidityIcon: { fontSize: 11 },
  liquidityText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  minAmount: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
});
