import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ headerShown: true, title: 'Iniciar sesión', headerBackVisible: false }} />
      <Stack.Screen name="register" options={{ headerShown: true, title: 'Crear cuenta', headerBackVisible: false }} />
      <Stack.Screen name="detail" />
    </Stack>
  );
}
