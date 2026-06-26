import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { SavingsOption } from '@/constants/savings';

const RISK_COLORS: Record<string, string> = {
  'muy bajo': Colors.riskLow,
  bajo: '#5DADE2',
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
      : `${option.rateMin}% – ${option.rateMax}%`;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(option)}
      activeOpacity={0.85}
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
          <Text style={styles.minAmount}>Desde S/ {option.minAmount.toLocaleString()}</Text>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '05',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleBlock: { flex: 1, marginRight: 12 },
  institution: { fontSize: 12, fontWeight: '600', color: Colors.primaryLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  rightBlock: { alignItems: 'flex-end', gap: 8 },
  rateBlock: { alignItems: 'flex-end' },
  rate: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  rateLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  selectBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  selectBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  selectBtnText: { fontSize: 14, fontWeight: '800', color: Colors.textMuted },
  selectBtnTextActive: { color: '#FFF' },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  liquidityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  liquidityIcon: { fontSize: 11 },
  liquidityText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  minAmount: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
});
