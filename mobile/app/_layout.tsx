import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="login" options={{ title: 'Iniciar sesión', headerBackVisible: false }} />
      <Stack.Screen name="register" options={{ title: 'Crear cuenta', headerBackVisible: false }} />
    </Stack>
  );
}
