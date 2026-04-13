import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { register } from '../../../data/repositories/AuthRepository';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!email || !username || !password) {
      setError('Rellena todos los campos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await register(email, username, password);
      Alert.alert(
        'Cuenta creada',
        `Bienvenido, ${user.username}. Ya puedes iniciar sesión.`,
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 409) {
        setError(detail ?? 'El email o nombre de usuario ya existe');
      } else if (status === 422) {
        setError('Datos inválidos. Revisa el email y la contraseña.');
      } else {
        setError('Error de conexión. ¿Está el backend corriendo?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Crear cuenta</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      <Text>Nombre de usuario</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="usuario123"
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
        title={loading ? 'Registrando...' : 'Registrarse'}
        onPress={handleRegister}
        disabled={loading}
      />

      <View style={{ marginTop: 16 }}>
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => router.replace('/login')}
        />
      </View>
    </View>
  );
}
