import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export interface CategoriaGasto {
  nombre: string;
  monto: number;
  porcentaje: number;
}

interface Props {
  categorias: CategoriaGasto[];
}

const BAR_COLORS = [Colors.primary, Colors.accent, Colors.riskBajo, Colors.highlight, Colors.warning, Colors.danger];

const fmt = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

export function CategorySpendChart({ categorias }: Props) {
  const sorted = [...categorias].sort((a, b) => b.monto - a.monto);
  const maxMonto = Math.max(...sorted.map((c) => c.monto), 1);

  return (
    <View style={styles.container}>
      {sorted.map((cat, i) => {
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const width = (cat.monto / maxMonto) * 100;
        return (
          <View key={cat.nombre} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowLabel} numberOfLines={1}>{cat.nombre}</Text>
              <Text style={[styles.rowAmount, { color }]}>{fmt(cat.monto)}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.rowPercent}>{cat.porcentaje.toFixed(0)}% del total</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  row: { gap: 6 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 13, fontFamily: 'Figtree_600SemiBold', color: Colors.textPrimary, flex: 1 },
  rowAmount: { fontSize: 14, fontFamily: 'Archivo_800ExtraBold' },
  barBg: { height: 10, backgroundColor: Colors.border, borderRadius: 5 },
  barFill: { height: 10, borderRadius: 5 },
  rowPercent: { fontSize: 11, fontFamily: 'Figtree_400Regular', color: Colors.textMuted },
});
