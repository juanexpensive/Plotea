import { Button, Text, TextInput, View } from 'react-native';
import { useRegisterViewModel } from './RegisterViewModel';

export default function RegisterScreen() {
  const { email, setEmail, username, setUsername, password, setPassword, loading, error, handleRegister, goToLogin } =
    useRegisterViewModel();

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
        <Button title="¿Ya tienes cuenta? Inicia sesión" onPress={goToLogin} />
      </View>
    </View>
  );
}
