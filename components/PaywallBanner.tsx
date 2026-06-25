import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

interface Props {
  feature: string;
}

export default function PaywallBanner({ feature }: Props) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <View style={styles.text}>
        <Text style={styles.title}>{feature}</Text>
        <Text style={styles.sub}>Disponible en el plan Pro</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/upgrade')}>
        <Text style={styles.btnText}>Ver Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    gap: 10,
  },
  icon: { fontSize: 22 },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});
