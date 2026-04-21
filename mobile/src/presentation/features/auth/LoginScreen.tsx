import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { useLoginViewModel } from './LoginViewModel';

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
    goToRegister,
    goToForgotPassword,
  } = useLoginViewModel();

  return (
    <ScrollView contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Iniciar sesion</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16 }}
      />

      <Text>Contrasena</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="********"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 24 }}
      />

      {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}

      <Button
        title={loading ? 'Entrando...' : 'Iniciar sesion'}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={{ marginTop: 16 }}>
        <Button title="He olvidado mi contrasena" onPress={goToForgotPassword} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Button title="No tienes cuenta? Registrate" onPress={goToRegister} />
      </View>
    </ScrollView>
  );
}
