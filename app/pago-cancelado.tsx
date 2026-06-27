import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function PagoCanceladoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.icon}>😕</Text>
        <Text style={styles.title}>Pago no completado</Text>
        <Text style={styles.body}>
          No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/upgrade')}>
          <Text style={styles.btnPrimaryText}>Intentar de nuevo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/')}>
          <Text style={styles.btnSecondaryText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  btnSecondary: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
});
