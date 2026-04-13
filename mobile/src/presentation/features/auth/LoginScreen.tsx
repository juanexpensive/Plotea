import { router } from 'expo-router';
import { useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { login } from '../../../data/repositories/AuthRepository';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleLogin() {
    if (!email || !password) {
      setError('Rellena todos los campos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/home');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas');
      } else if (status === 422) {
        setError('Datos inválidos. Revisa el email.');
      } else {
        setError('Error de conexión. ¿Está el backend corriendo?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Iniciar sesión</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      <Text>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 24 }}
      />

      {error && (
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
      )}

      <Button
        title={loading ? 'Entrando...' : 'Iniciar sesión'}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={{ marginTop: 16 }}>
        <Button
          title="¿No tienes cuenta? Regístrate"
          onPress={() => router.replace('/register')}
        />
      </View>
    </ScrollView>
  );
}
