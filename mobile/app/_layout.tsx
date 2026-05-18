import { Stack } from 'expo-router';
import { darkDesign } from '../src/presentation/theme/darkDesign';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkDesign.colors.canvas },
        headerStyle: { backgroundColor: darkDesign.colors.canvasRaised },
        headerTintColor: darkDesign.colors.text,
        headerTitleStyle: { color: darkDesign.colors.text, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="login"
        options={{ headerShown: true, title: 'Iniciar sesion', headerBackVisible: false }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: true, title: 'Crear cuenta', headerBackVisible: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: true, title: 'Recuperar contrasena' }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ headerShown: true, title: 'Nueva contrasena' }}
      />
      <Stack.Screen name="detail" />
      <Stack.Screen
        name="media-status-list"
        options={{ headerShown: true, title: 'Mi lista' }}
      />
      <Stack.Screen
        name="watchlog-list"
        options={{ headerShown: true, title: 'Diario' }}
      />
      <Stack.Screen
        name="user-search"
        options={{ headerShown: true, title: 'Buscar usuarios' }}
      />
      <Stack.Screen
        name="user-profile"
        options={{ headerShown: true, title: 'Perfil publico' }}
      />
      <Stack.Screen
        name="profile-network"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="my-lists"
        options={{ headerShown: true, title: 'Mis listas' }}
      />
      <Stack.Screen
        name="list-detail"
        options={{ headerShown: true, title: 'Lista' }}
      />
    </Stack>
  );
}
