import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { AuthProvider } from '@/context/auth';
import { GamificationProvider } from '@/context/gamification';
import { Colors } from '@/constants/colors';
import ChatBot from '@/components/ChatBot';
import GamificationBadge from '@/components/GamificationBadge';
import XPToast from '@/components/XPToast';
import { useFonts } from 'expo-font';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';

// Head solo disponible en web
let Head: React.ComponentType<{ children: React.ReactNode }> | null = null;
if (Platform.OS === 'web') {
  Head = require('expo-router/head').Head;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
    <GamificationProvider>
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {Head && (
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="description" content="Descubre dónde hacer crecer tus ahorros en soles. Compara tasas, calcula intereses y crea tu plan de ahorro con datos en tiempo real del BCRP." />
          <meta name="theme-color" content="#F6F4EC" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="AhorraPeru" />
          <meta property="og:title" content="AhorraPeru — Haz crecer tus soles" />
          <meta property="og:description" content="Compara cuentas, depósitos y fondos mutuos en Perú. Datos reales del BCRP." />
          <meta property="og:type" content="website" />
          <title>AhorraPeru — Haz crecer tus soles</title>
        </Head>
      )}
      <Stack>
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detalle"
          options={{
            title: 'Detalle',
            headerBackTitle: 'Volver',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.surface },
            headerTitleStyle: { color: Colors.textPrimary },
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="upgrade"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="estado-cuenta"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="progreso"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="comparar"
          options={{
            title: 'Comparar',
            headerBackTitle: 'Volver',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.surface },
            headerTitleStyle: { color: Colors.textPrimary },
          }}
        />
        <Stack.Screen name="pago-exitoso" options={{ headerShown: false }} />
        <Stack.Screen name="pago-cancelado" options={{ headerShown: false }} />
      </Stack>
      <ChatBot />
      <GamificationBadge />
      <XPToast />
    </View>
    </GamificationProvider>
    </AuthProvider>
  );
}
