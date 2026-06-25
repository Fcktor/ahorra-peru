import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { AuthProvider } from '@/context/auth';

// Head solo disponible en web
let Head: React.ComponentType<{ children: React.ReactNode }> | null = null;
if (Platform.OS === 'web') {
  Head = require('expo-router/head').Head;
}

export default function RootLayout() {
  return (
    <AuthProvider>
    <>
      {Head && (
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="description" content="Descubre dónde hacer crecer tus ahorros en soles. Compara tasas, calcula intereses y crea tu plan de ahorro con datos en tiempo real del BCRP." />
          <meta name="theme-color" content="#1A5276" />
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detalle"
          options={{
            title: 'Detalle',
            headerBackTitle: 'Volver',
            headerTintColor: '#1A5276',
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
      </Stack>
    </>
    </AuthProvider>
  );
}
