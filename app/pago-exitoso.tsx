import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth';

export default function PagoExitosoScreen() {
  const router = useRouter();
  const { user, refreshPlan } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [checking, setChecking] = useState(true);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const poll = async () => {
      const plan = await refreshPlan();
      if (plan === 'pro' || plan === 'b2b') {
        setConfirmed(true);
        setChecking(false);
        return;
      }
      attemptsRef.current += 1;
      if (attemptsRef.current >= 15) {
        setChecking(false);
        return;
      }
      setTimeout(poll, 2000);
    };

    poll();
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        {checking ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.checking}>Verificando tu pago...</Text>
            <Text style={styles.sub}>Esto toma unos segundos</Text>
          </>
        ) : confirmed ? (
          <>
            <Text style={styles.icon}>🎉</Text>
            <Text style={styles.title}>¡Eres Pro!</Text>
            <Text style={styles.body}>
              Tu plan Pro está activo. Ya tienes acceso a todas las funciones premium.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
              <Text style={styles.btnText}>Ir a la app →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.icon}>⏳</Text>
            <Text style={styles.title}>Pago en proceso</Text>
            <Text style={styles.body}>
              Tu pago está siendo verificado por Mercado Pago. En unos minutos tu plan Pro estará activo.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
              <Text style={styles.btnText}>Ir a la app</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 20 },
  checking: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 20 },
  title: { fontSize: 28, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.primary, textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 8 },
  body: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },
});
