import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { BCRPData } from '@/services/bcrp';

interface Props {
  data: BCRPData | null;
  loading: boolean;
}

const ON_DARK_TEXT = '#EAF6EE';
const ON_DARK_MUTED = '#A9D9BE';
const PULSE_DOT = '#8FE3B0';

function PulseDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View style={[styles.dot, { opacity: pulse, transform: [{ scale: pulse }] }]} />;
}

export default function BCRPWidget({ data, loading }: Props) {
  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.35, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <PulseDot />
        <Text style={styles.title}>BCRP · TIEMPO REAL</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={ON_DARK_TEXT} style={{ marginTop: 8 }} />
      ) : (
        <View style={styles.row}>
          <Stat
            label="Tasa"
            hint="referencia"
            value={data?.tasaReferencia != null ? `${data.tasaReferencia}%` : 'n.d.'}
          />
          <View style={styles.divider} />
          <Stat
            label="TIPMN"
            hint="bancos · soles"
            value={data?.tipmn != null ? `${data.tipmn}%` : 'n.d.'}
          />
          <View style={styles.divider} />
          <Stat
            label="Inflación"
            hint="var. mensual"
            value={data?.inflacion != null ? `${data.inflacion.toFixed(2)}%` : 'n.d.'}
          />
        </View>
      )}
    </LinearGradient>
  );
}

function Stat({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}{'\n'}{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: PULSE_DOT },
  title: {
    color: ON_DARK_TEXT,
    fontSize: 11,
    fontFamily: 'Figtree_700Bold',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stat: { flex: 1 },
  statValue: {
    fontSize: 24,
    fontFamily: 'Archivo_800ExtraBold',
    color: ON_DARK_TEXT,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Figtree_400Regular',
    color: ON_DARK_MUTED,
    marginTop: 3,
    lineHeight: 15,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: 10,
  },
});
