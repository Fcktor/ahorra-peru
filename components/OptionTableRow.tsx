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
  selected: boolean;
  onPress: (option: SavingsOption) => void;
  onSelect: (option: SavingsOption) => void;
}

export default function OptionTableRow({ option, selected, onPress, onSelect }: Props) {
  const riskColor = RISK_COLORS[option.risk] ?? Colors.textMuted;
  const rateDisplay = option.rateMin === option.rateMax ? `${option.rateMin}%` : `${option.rateMin}–${option.rateMax}%`;
  const initials = option.institution.split(/[\s·,]+/)[0].slice(0, 3).toUpperCase();

  return (
    <TouchableOpacity style={[styles.row, selected && styles.rowSelected]} onPress={() => onPress(option)} activeOpacity={0.7}>
      <View style={styles.productCell}>
        <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>{option.name}</Text>
          <Text style={styles.productInstitution} numberOfLines={1}>{option.institution}</Text>
        </View>
      </View>
      <Text style={styles.categoryCell} numberOfLines={1}>{option.category}</Text>
      <Text style={styles.treaCell}>{rateDisplay}</Text>
      <Text style={styles.minCell}>{option.minAmount > 0 ? `S/ ${option.minAmount.toLocaleString()}` : 'S/ 0'}</Text>
      <View style={styles.riskCell}>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>{option.risk}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.selectBtn, selected && styles.selectBtnActive]}
        onPress={(e) => { e.stopPropagation?.(); onSelect(option); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>{selected ? '✓' : '+'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const GRID_COLUMNS = '2.4fr 1.3fr 1fr 1fr 0.9fr 44px';

const styles = StyleSheet.create({
  row: {
    // @ts-expect-error react-native-web supports CSS grid via style passthrough
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0E6',
  },
  rowSelected: { backgroundColor: Colors.primary + '10' },
  productCell: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  iconBadge: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBadgeText: { fontFamily: 'Archivo_800ExtraBold', fontSize: 13, color: Colors.textSecondary },
  productName: { fontFamily: 'Archivo_800ExtraBold', fontSize: 15, color: Colors.textPrimary },
  productInstitution: { fontSize: 12.5, fontFamily: 'Figtree_400Regular', color: Colors.textMuted, marginTop: 1 },
  categoryCell: { fontSize: 13.5, fontFamily: 'Figtree_400Regular', color: '#4B5A52' },
  treaCell: { fontFamily: 'Archivo_800ExtraBold', fontSize: 18, color: Colors.primary, textAlign: 'right' },
  minCell: { fontSize: 14, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, textAlign: 'right' },
  riskCell: { alignItems: 'center' },
  riskBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  riskText: { fontSize: 11.5, fontFamily: 'Figtree_700Bold', textTransform: 'capitalize' },
  selectBtn: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  selectBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  selectBtnText: { fontSize: 15, fontFamily: 'Figtree_700Bold', color: Colors.textMuted },
  selectBtnTextActive: { color: Colors.background },
});
