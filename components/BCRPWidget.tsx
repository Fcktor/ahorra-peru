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
      <Text style={styles.title}>BCRP · TIEMPO REAL</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
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
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  title: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    marginBottom: 14,
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statHint: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
});
