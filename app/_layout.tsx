import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
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
    </Stack>
  );
}
