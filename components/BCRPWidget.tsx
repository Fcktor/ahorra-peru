import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { BCRPData } from '@/services/bcrp';

interface Props {
  data: BCRPData | null;
  loading: boolean;
}

export default function BCRPWidget({ data, loading }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Datos en tiempo real · BCRP</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primaryLight} style={{ marginTop: 8 }} />
      ) : (
        <View style={styles.row}>
          <Stat
            label="Tasa Referencia"
            value={data?.tasaReferencia != null ? `${data.tasaReferencia}%` : 'n.d.'}
            hint="Fijada por el BCRP"
          />
          <View style={styles.divider} />
          <Stat
            label="TIPMN"
            value={data?.tipmn != null ? `${data.tipmn}%` : 'n.d.'}
            hint="Promedio bancos · soles"
          />
          <View style={styles.divider} />
          <Stat
            label="Inflación"
            value={data?.inflacion != null ? `${data.inflacion.toFixed(2)}%` : 'n.d.'}
            hint="Variación mensual"
          />
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
  statHint: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 1 },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
});
